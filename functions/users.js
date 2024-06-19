const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cloneBoard = require("./clone-board");
const { makeUser, makeUserFromUid } = require("./access");
const {
  emailToId,
  isDevProject,
  isFunctionsEmulator,
  isValidEmail,
  assertAppCheck,
  getMailgunClient,
  isDev,
} = require("./utils");
const { wrapEventFunction } = require("./sentry");
const { ThemeColors } = require("./constant");

const dbPath = "/users/{user_id}";
let readmeBoardID;

if (!isFunctionsEmulator()) {
  if (isDevProject()) {
    readmeBoardID = "-MTwstfg0cqtLKKgxuaM";
  } else {
    readmeBoardID = "-MOM6QTL3UaFYX92yc29";
  }
}

const handleReadmeCloning = async (user) => {
  if (readmeBoardID) {
    const readmeBoardSnap = await admin
      .database()
      .ref(`/whiteboards/${readmeBoardID}`)
      .once("value");

    if (readmeBoardSnap.exists()) {
      const readmeBoard = readmeBoardSnap.val();

      await cloneBoard(user, readmeBoardID, readmeBoard, {
        reassignFileOwnership: false,
        namePrefix: "",
      });
    } else {
      functions.logger.warn(
        `Could not find README board (ID: ${readmeBoardID})`
      );
    }
  }
};

const processSignUp = async (user) => {
  if (
    user.email &&
    (user.email.endsWith("@rossmach.com") ||
      user.email.endsWith("@alanross.biz") ||
      user.email.endsWith("@whatboard.app")) &&
    user.emailVerified
  ) {
    const customClaims = {
      isSpecial: true,
    };

    await admin.auth().setCustomUserClaims(user.uid, {
      ...(user.customClaims || {}),
      ...customClaims,
    });

    // Update real-time database to notify client to force refresh.
    const metadataRef = admin
      .database()
      .ref(`metadata/${emailToId(user.email)}`);
    // Set the refresh time to the current UTC timestamp.
    // This will be captured on the client to force a token refresh.
    await metadataRef.update({
      refreshTime: admin.database.ServerValue.TIMESTAMP,
    });
  }
  const newUser = await makeUser(user);
  handleReadmeCloning(newUser);
};

exports.getAllUsers = functions.https.onCall(
  wrapEventFunction(
    async (data, context) => {
      assertAppCheck(context);
      const maxResults = 1000; // optional arg.
      const usersList = [];

      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "This function must be called while authenticated."
        );
      }

      const { email } = context.auth.token;

      if (email.endsWith("@rossmach.com") || email.endsWith("@alanross.biz")) {
        const userRecords = await admin.auth().listUsers(maxResults);

        userRecords.users.forEach((user) => {
          if (user.providerData.length) {
            usersList.push(user);
          }
        });

        return usersList;
      }

      throw new functions.https.HttpsError(
        "permission-denied",
        "You do not have access to this."
      );
    },
    { functionName: "users-getAllUsers" }
  )
);

exports.processSignUp = functions.auth.user().onCreate(
  wrapEventFunction((user) => {
    return processSignUp(user);
  })
);

exports.cloneReadMeBoard = functions.https.onCall(
  wrapEventFunction(
    async (data, context) => {
      assertAppCheck(context);
      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "This function must be called while authenticated."
        );
      }

      const user = await makeUserFromUid(context.auth.uid);

      return handleReadmeCloning(user);
    },
    { functionName: "users-cloneReadMeBoard" }
  )
);

exports.confirmEmailVerified = functions.https.onCall(
  wrapEventFunction(
    async (data, context) => {
      assertAppCheck(context);
      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "This function must be called while authenticated."
        );
      }

      const { email } = context.auth.token;

      let user;

      try {
        user = await admin.auth().getUserByEmail(email);
      } catch (e) {
        if (e.code === "auth/user-not-found") {
          throw new functions.https.HttpsError(
            "not-found",
            `Cannot find User with email "${email}".`
          );
        } else {
          throw new functions.https.HttpsError("unknown", e.message);
        }
      }

      if (!user.emailVerified) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "Your email address has not been verified"
        );
      }

      return processSignUp(user);
    },
    { functionName: "users-confirmEmailVerified" }
  )
);

exports.onUpdateName = functions.database
  .ref(`${dbPath}/display_name`)
  .onUpdate(
    wrapEventFunction(async (change, context) => {
      const { user_id } = context.params;

      const oldName = change.before.val();
      const newName = change.after.val();

      if (oldName === newName) {
        return;
      }

      const rootRef = change.after.ref.root;
      const userChats = await rootRef
        .child(`user-chats/${user_id}`)
        .once("value");

      const updates = {};

      userChats.forEach((snapshot) => {
        const chat = snapshot.val();

        updates[
          `chats/${chat.board_id}/${chat.block_id}/${chat.chat_id}/sender`
        ] = newName;
      });

      await rootRef.update(updates);
    })
  );

exports.disableUser = functions.https.onCall(
  wrapEventFunction(
    async (data, context) => {
      assertAppCheck(context);
      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "This function must be called while authenticated."
        );
      }

      const { email, isAdmin } = context.auth.token;
      const { user_id } = data;

      let user;

      try {
        user = await admin.auth().getUserByEmail(email);
      } catch (e) {
        if (e.code === "auth/user-not-found") {
          throw new functions.https.HttpsError(
            "not-found",
            `Cannot find User with email "${email}".`
          );
        } else {
          throw new functions.https.HttpsError("unknown", e.message);
        }
      }

      if (!user.emailVerified) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "Your email address has not been verified"
        );
      }

      if (!isAdmin) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "You do not have access to this function"
        );
      }

      try {
        await admin.auth().updateUser(user_id, {
          disabled: true,
        });

        const disabledUser = admin.auth().getUser(user_id);
        const templateVariables = {
          // eslint-disable-next-line camelcase
          display_name: disabledUser.displayName,
        };

        const params = {
          from: "Whatboard LLC <noreply@mg.whatboard.app>",
          to: [`${disabledUser.displayName}  <${disabledUser.email}>`],
          subject: "Your Whatboard Account Disabled",
          template: "account-disabled",
          "t:text": "yes",
          "o:tag": ["account-disabled"],
          "h:X-Mailgun-Variables": JSON.stringify(templateVariables),
        };

        const mg = getMailgunClient();
        await mg.messages.create(functions.config().mailgun.domain, params);
      } catch (e) {
        throw new functions.https.HttpsError("unknown", e.message);
      }
    },
    { functionName: "users-disableUser" }
  )
);

exports.removeUser = functions.https.onCall(
  wrapEventFunction(
    async (data, context) => {
      assertAppCheck(context);
      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "This function must be called while authenticated."
        );
      }

      const { email, isAdmin } = context.auth.token;
      const { user_id } = data;

      let user;

      try {
        user = await admin.auth().getUserByEmail(email);
      } catch (e) {
        if (e.code === "auth/user-not-found") {
          throw new functions.https.HttpsError(
            "not-found",
            `Cannot find User with email "${email}".`
          );
        } else {
          throw new functions.https.HttpsError("unknown", e.message);
        }
      }

      if (!user.emailVerified) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "Your email address has not been verified"
        );
      }

      if (!isAdmin) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "You do not have access to this function"
        );
      }

      try {
        const userJson = await admin.auth().getUser(user_id);
        if (userJson && userJson.email) {
          const emailID = emailToId(userJson.email);
          const ref = await admin
            .database()
            .ref(`/users/${emailID}/whiteboards`)
            .once("value");
          const whiteboards = ref.val();

          if (whiteboards) {
            Object.entries(whiteboards).forEach(([key, board]) => {
              if (board.board_members[0] === emailID) {
                admin.database().ref(`/whiteboards/${key}`).remove();
              } else {
                admin
                  .database()
                  .ref(`/whiteboards/${key}/board_members`)
                  .child(`${board.board_members.indexOf(emailID)}`)
                  .remove();
              }
            });
          }
          admin.database().ref(`/users/${emailID}`).remove();
        }
        await admin.auth().deleteUser(user_id);
      } catch (e) {
        throw new functions.https.HttpsError("unknown", e.message);
      }
    },
    { functionName: "users-removeUser" }
  )
);

exports.addEmailToAddressBook = functions.https.onCall(
  wrapEventFunction(
    async (data, context) => {
      assertAppCheck(context);
      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "This function must be called while authenticated."
        );
      }

      const { email: userEmail } = context.auth.token;
      const { emails } = data;

      if (!emails) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          'The "emails" field is required.'
        );
      }

      if (!Array.isArray(emails)) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          'The "emails" field must be an array.'
        );
      }

      if (!emails.length) {
        return;
      }

      const update = {};

      for (const invitedEmail of emails) {
        if (isValidEmail(invitedEmail)) {
          const emailId = emailToId(invitedEmail);
          update[emailId] = invitedEmail;
        } else {
          throw new functions.https.HttpsError(
            "invalid-argument",
            `"${invitedEmail}" is not a valid email address.`
          );
        }
      }

      try {
        const addressBookRef = admin
          .database()
          .ref(`users/${emailToId(userEmail)}/addressbook`);
        await addressBookRef.update(update);
      } catch (e) {
        if (e.code === "auth/user-not-found") {
          throw new functions.https.HttpsError(
            "not-found",
            `Cannot find User with email "${userEmail}".`
          );
        } else {
          throw new functions.https.HttpsError("unknown", e.message);
        }
      }
    },
    { functionName: "users-addEmailToAddressBook" }
  )
);

exports.getAddressBookForUser = functions.https.onCall(
  wrapEventFunction(
    async (data, context) => {
      assertAppCheck(context);
      const { email } = context.auth.token;
      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "This function must be called while authenticated."
        );
      }
      try {
        const ref = admin
          .database()
          .ref(`/users/${emailToId(email)}/addressbook`);
        const snapshot = await ref.once("value");

        if (!snapshot.exists()) {
          return {};
        }
        return snapshot.val();
      } catch (e) {
        if (e.code === "PERMISSION_DENIED") {
          throw new functions.https.HttpsError(
            "permission-denied",
            "You do not have permission to access this Whatboard"
          );
        } else {
          throw new functions.https.HttpsError("unknown", e.message);
        }
      }
    },
    { functionName: "users-getAddressBookForUser" }
  )
);

exports.addToMailingList = functions.https.onCall(
  wrapEventFunction(
    async (data, context) => {
      assertAppCheck(context);

      const mg = getMailgunClient();

      let { email, mailingList } = data;

      if (typeof mailingList !== "string") {
        mailingList = "";
      } else {
        mailingList = mailingList.trim();
      }

      if (!mailingList) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          'The "mailingList" field is required'
        );
      }

      if (isDev()) {
        mailingList = `${mailingList}-dev`;
      }

      if (typeof email !== "string") {
        email = "";
      } else {
        email = email.trim();
      }

      if (!email) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          'The "email" field is required.'
        );
      }

      if (!isValidEmail(email)) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          `"${email}" is not a valid email address.`
        );
      }

      const { domain } = functions.config().mailgun;
      const mailingListAddress = `${mailingList}@${domain}`;

      try {
        const result = await mg.lists.members.createMember(mailingListAddress, {
          address: email,
          subscribed: "yes",
          upsert: "no",
        });

        return result;
      } catch (e) {
        const details = JSON.parse(e.details);
        const { message } = details;
        throw new functions.https.HttpsError("unknown", message, e);
      }
    },
    { functionName: "users-addToMailingList" }
  )
);

exports.onUpdateBranding = functions.database.ref(`${dbPath}/branding`).onWrite(
  wrapEventFunction(async (change, context) => {
    const { user_id } = context.params;
    const defaultColors = {
      boardHeaderColor: ThemeColors.NOCOLOR,
      boardBodyColor: ThemeColors.NOCOLOR,
    };
    let oldColors = change.before.val();
    let newColors = change.after.val();

    if (!oldColors) {
      oldColors = {
        ...defaultColors,
      };
    }

    if (!newColors) {
      newColors = {
        ...defaultColors,
      };
    }

    const userBoardsRef = admin
      .database()
      .ref(`/whiteboards`)
      .orderByChild("board_members/0")
      .equalTo(user_id);
    const userBoardsSnap = await userBoardsRef.once("value");

    const updates = {};

    userBoardsSnap.forEach((boardSnap) => {
      const { board_header_color, boardBodyColor } = boardSnap.val();

      if (
        (!board_header_color && !boardBodyColor) ||
        (board_header_color === oldColors.boardHeaderColor &&
          boardBodyColor === oldColors.boardBodyColor)
      ) {
        const path = `/whiteboards/${boardSnap.key}`;
        updates[`${path}/board_header_color`] = newColors.boardHeaderColor;
        updates[`${path}/boardBodyColor`] = newColors.boardBodyColor;
      }
    });

    await admin.database().ref().update(updates);
  })
);
