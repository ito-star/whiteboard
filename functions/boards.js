const functions = require("firebase-functions");
const admin = require("firebase-admin");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Dayjs = require("dayjs");
const pAll = require("p-all");
const {
  emailToId,
  isValidEmail,
  createUUID,
  idToEmail,
  getWhatboardUrl,
  assertAppCheck,
  getMailgunClient,
  isDev,
  runAsUser,
} = require("./utils");
const { makeUserFromUid, makeUserFromWbId, access } = require("./access");
const sendInvitation = require("./send-invitation");
const { sendAllReports: sendReport } = require("./send-report");
const cloneBoard = require("./clone-board");
const { wrapEventFunction } = require("./sentry");

const dbPath = "/whiteboards/{board_id}";

const getBoardById = async (id, idToken, fbUserApp) => {
  try {
    const runner = async (userApp) => {
      const ref = userApp.database().ref(`/whiteboards/${id}`);
      const snapshot = await ref.once("value");

      if (!snapshot.exists()) {
        throw new Error("whatboard-not-found");
      }

      return snapshot.val();
    };

    let board;

    if (idToken) {
      board = await runAsUser(runner, idToken);
    } else {
      board = await runner(fbUserApp || admin);
    }

    return board;
  } catch (e) {
    if (e.message === "whatboard-not-found") {
      throw new functions.https.HttpsError(
        "not-found",
        `Cannot find Whatboard with ID "${id}".`
      );
    } else if (e.code === "PERMISSION_DENIED") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "You do not have permission to access this Whatboard"
      );
    } else {
      throw new functions.https.HttpsError("unknown", e.message);
    }
  }
};

const handleCreateBoard = async (snapshot, context) => {
  const { board_id } = context.params;
  const board = snapshot.val();
  const owner = emailToId(board.board_members[0]);

  if (board.unique_url && board.friendly_url) {
    await snapshot.ref.root.child(`friendlyUrl/${board.friendly_url}`).update({
      board_id,
      friendly_url: board.friendly_url,
      unique_url: board.unique_url,
    });
  }

  const boardUsageRef = snapshot.ref.root.child(
    `metadata/${owner}/usage/boards`
  );

  return boardUsageRef.transaction((count) => {
    return count + 1;
  });
};

const handleUpdateBoard = async (change, context) => {
  const { board_id } = context.params;
  const before = change.before.val();
  const after = change.after.val();

  if (after.unique_url && after.friendly_url) {
    const friendlyUrlUpdates = {};
    friendlyUrlUpdates[`friendlyUrl/${after.friendly_url}`] = {
      board_id: change.after.key,
      friendly_url: after.friendly_url,
      unique_url: after.unique_url,
    };

    if (before.friendly_url && before.friendly_url !== after.friendly_url) {
      friendlyUrlUpdates[`friendlyUrl/${before.friendly_url}`] = {};
    }

    await change.after.ref.root.update(friendlyUrlUpdates);
  } else if (
    (before.friendly_url && !after.friendly_url) ||
    (before.unique_url && !after.unique_url)
  ) {
    if (before.friendly_url) {
      await change.after.ref.root
        .child(`friendlyUrl/${before.friendly_url}`)
        .remove();
    }
  }

  if (after.board_members) {
    const oldBoardMembers = before.board_members || [];
    const newBoardMembers = after.board_members;

    let updates = {};

    const oldProps = Object.keys(before);
    const newProps = Object.keys(after);

    const propsToRemove = oldProps.filter((prop) => {
      return !newProps.includes(prop);
    });

    for (const x of newBoardMembers) {
      for (const [key, value] of Object.entries(after)) {
        updates[`users/${x}/whiteboards/${board_id}/${key}`] = value;
      }

      for (const prop of propsToRemove) {
        updates[`users/${x}/whiteboards/${board_id}/${prop}`] = null;
      }
    }

    await change.after.ref.root.update(updates);

    updates = {};

    const toRemove = oldBoardMembers.filter((id) => {
      return !newBoardMembers.includes(id);
    });

    for (const y of toRemove) {
      updates[`whiteboards/${board_id}/currentViewingUsers/${y}`] = {};
      updates[`users/${y}/whiteboards/${board_id}`] = {};
    }

    await change.after.ref.root.update(updates);
  }
};

const handleDeleteBoard = async (snapshot, context) => {
  const { board_id } = context.params;
  const board = snapshot.val();

  const updates = {};

  for (const x of board.board_members) {
    updates[`users/${x}/whiteboards/${board_id}`] = {};
  }

  if (board.friendly_url) {
    updates[`friendlyUrl/${board.friendly_url}`] = {};
  }

  await admin.database().ref().update(updates);

  const blocksPath = `/blocks/${board_id}`;
  const blocksRef = admin.database().ref(blocksPath);

  await blocksRef.remove();

  const owner = emailToId(board.board_members[0]);

  const boardUsageRef = snapshot.ref.root.child(
    `metadata/${owner}/usage/boards`
  );

  return boardUsageRef.transaction((count) => {
    return Math.max(0, count - 1);
  });
};

exports.onWrite = functions.database.ref(dbPath).onWrite(
  wrapEventFunction((change, context) => {
    const beforeSnap = change.before;
    const afterSnap = change.after;

    if (!beforeSnap.exists()) {
      return handleCreateBoard(afterSnap, context);
    }

    if (!afterSnap.exists()) {
      return handleDeleteBoard(beforeSnap, context);
    }

    return handleUpdateBoard(change, context);
  })
);

exports.onDeleteConnection = functions.database
  .ref(`${dbPath}/currentViewingUsers/{user_id}/connections`)
  .onDelete(
    wrapEventFunction(async (snap) => {
      const currentViewingUserSnap = await snap.ref.parent.once("value");

      if (currentViewingUserSnap.exists()) {
        currentViewingUserSnap.ref.remove();
      }
    })
  );

exports.resendInvitation = functions.https.onCall(
  wrapEventFunction(
    async (data, context) => {
      assertAppCheck(context);
      const boardHash = createUUID();
      const emailRef = admin.database().ref(`/invite-emails`);

      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "This function must be called while authenticated."
        );
      }

      let { email } = data;

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

      const { board_id } = data;

      if (!board_id) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          'The "board_id" field is required.'
        );
      }

      const board = await getBoardById(board_id, context.auth.token);

      const userEmail = context.auth.token.email;
      const userId = emailToId(userEmail);

      if (!board.board_members || !board.board_members.includes(userId)) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "You do not have permission to access this Whatboard"
        );
      }

      if (
        !board.board_members ||
        !board.board_members.includes(emailToId(email))
      ) {
        throw new functions.https.HttpsError(
          "not-found",
          `"${email}" is not a collaborator on this Whatboard`
        );
      }

      let { subject } = data;

      if (typeof subject !== "string") {
        subject = "";
      } else {
        subject = subject.trim();
      }

      emailRef.update({
        [boardHash]: {
          board_id,
          email,
          // eslint-disable-next-line camelcase
          sender_name: context.auth.token.name,
          // eslint-disable-next-line camelcase
          sender_email: userEmail,
          board_name: board.board_name,
        },
      });

      return sendInvitation(email, boardHash, board, subject, {
        displayName: context.auth.token.name || userEmail,
        email: userEmail,
      });
    },
    { functionName: "boards-resendInvitation" }
  )
);

exports.sendReportBoard = functions.https.onCall(
  wrapEventFunction(
    async (data, context) => {
      assertAppCheck(context);
      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "This function must be called while authenticated."
        );
      }

      let reporter;

      if (context.auth.token.provider_id === "anonymous") {
        throw new functions.https.HttpsError(
          "permission-denied",
          "You must signup/login in order to file a TOS Violation Report"
        );
      } else {
        reporter = {
          displayName: context.auth.token.name || context.auth.token.email,
          email: context.auth.token.email,
        };
      }

      const { board_id, readOnlyId, reportReason } = data;

      if (!board_id) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          'The "board_id" field is required.'
        );
      }

      if (!readOnlyId) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          'The "readOnlyId" field is required.'
        );
      }

      if (!reportReason) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          'The "violationType" field is required.'
        );
      }

      const board = await getBoardById(board_id, context.auth.token);

      return sendReport(board_id, readOnlyId, board, reporter, reportReason);
    },
    { functionName: "boards-sendReportBoard" }
  )
);

exports.removeReportedBoard = functions.https.onCall(
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
      const { board_id } = data;

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
        await admin.database().ref(`/whiteboards/${board_id}`).set({});
      } catch (e) {
        throw new functions.https.HttpsError("unknown", e.message);
      }
    },
    { functionName: "boards-removeReportedBoard" }
  )
);

const discountBoardLimit = async (boardId) => {
  const loadLimitRef = admin
    .database()
    .ref(`/whiteboards/${boardId}/loadLimit`);

  await loadLimitRef.transaction((limit) => {
    return limit === -1 ? limit : Math.max((limit || 0) - 1, 0);
  });
};

exports.cloneBoard = functions.https.onCall(
  wrapEventFunction(
    async (data, context) => {
      assertAppCheck(context);
      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "This function must be called while authenticated."
        );
      }

      const { boardId, cloneFiles } = data;

      if (!boardId) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          'The "boardId" field is required.'
        );
      }

      const board = await getBoardById(boardId, context.auth.token);

      const user = await makeUserFromUid(context.auth.uid);

      if (board.loadLimit === 0) {
        const boardOwner = await makeUserFromWbId(board.board_members[0]);
        const maxBoardLoads = await access.getMaxBoardLoads(boardOwner);

        if (!board.isReportSent) {
          sendReport(
            boardId,
            "",
            board,
            { displayName: "System" },
            `Exceeded Usage Limit (${maxBoardLoads} views per day)`
          );

          const reportSentRef = admin
            .database()
            .ref(`/whiteboards/${boardId}/isReportSent`);

          await reportSentRef.transaction(() => true);
        }

        throw new functions.https.HttpsError(
          "resource-exhausted",
          `Exceeded Usage Limit (${maxBoardLoads} views per day)`
        );
      }

      if (!board.board_members || !board.board_members.includes(user.wbid)) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "You do not have permission to access this Whatboard"
        );
      }

      await discountBoardLimit(boardId);

      return cloneBoard(user, boardId, board, {
        cloneFiles,
      });
    },
    { functionName: "boards-cloneBoard" }
  )
);

exports.cloneTemplate = functions.https.onCall(
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

      const { boardId, name } = data;

      if (!boardId) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          'The "boardId" field is required.'
        );
      }

      const board = getBoardById(boardId);

      const templatesQuery = admin
        .database()
        .ref("/templates")
        .orderByChild("board_id")
        .equalTo(boardId);
      const templatesSnap = await templatesQuery.once("value");

      if (!templatesSnap.numChildren()) {
        throw new functions.https.HttpsError(
          "permission-denied",
          `Whatboard ${board.board_name} is not a valid template`
        );
      }

      return cloneBoard(user, boardId, board, {
        reassignFileOwnership: false,
        cloneFiles: false,
        namePrefix: "",
        name,
      });
    },
    { functionName: "boards-cloneTemplate" }
  )
);

exports.getBoardDetails = functions
  .runWith({ minInstances: isDev() ? 0 : 5 })
  .https.onCall(
    wrapEventFunction(
      async (data, context) => {
        assertAppCheck(context);
        if (!context.auth) {
          throw new functions.https.HttpsError(
            "unauthenticated",
            "This function must be called while authenticated."
          );
        }
        const { boardId, token, isBoardLoad } = data;
        const board = await getBoardById(boardId, context.auth.token);

        const user = await makeUserFromWbId(board.board_members[0]);
        const maxBoardLoads = await access.getMaxBoardLoads(user);

        if (isBoardLoad && board.loadLimit === 0) {
          if (!board.isReportSent) {
            sendReport(
              boardId,
              "",
              board,
              { displayName: "System" },
              `Exceeded Usage Limit (${maxBoardLoads} views per day)`
            );

            const reportSentRef = admin
              .database()
              .ref(`/whiteboards/${boardId}/isReportSent`);

            await reportSentRef.transaction(() => true);
          }

          return {
            limited: true,
            boardName: board.board_name,
            headerColor: board.board_header_color,
            boardOwner: board.board_members[0],
          };
        }

        if (isBoardLoad) {
          await discountBoardLimit(boardId);
        }

        if (token) {
          try {
            const decoded = jwt.verify(
              token,
              functions.config().jwt.secret_key
            );
            if (decoded.board_id === boardId) {
              return board;
            }
            return { locked: true, boardOwner: board.board_members[0] };
          } catch (err) {
            return { locked: true, boardOwner: board.board_members[0] };
          }
        }

        if (board.password) {
          return { locked: true, boardOwner: board.board_members[0] };
        }

        return board;
      },
      { functionName: "boards-getBoardDetails" }
    )
  );

exports.updateBoardDigest = functions
  .runWith({ minInstances: isDev() ? 0 : 5 })
  .https.onCall(
    wrapEventFunction(
      async (data, context) => {
        assertAppCheck(context);
        if (!context.auth) {
          throw new functions.https.HttpsError(
            "unauthenticated",
            "This function must be called while authenticated."
          );
        }
        const { boardId, email, action } = data;

        const board = await getBoardById(boardId, context.auth.token);

        if (idToEmail(board.board_members[0]) === email) return;

        const today = Dayjs(new Date()).format("YYYY-MM-DD");
        const ref = admin.database().ref(`/digest-logs/${boardId}/${today}`);
        ref.push({
          email,
          action,
          createdAt: admin.database.ServerValue.TIMESTAMP,
        });
      },
      { functionName: "boards-updateBoardDigest" }
    )
  );

exports.getDailyDigest = functions.https.onCall(
  wrapEventFunction(
    async (data, context) => {
      assertAppCheck(context);
      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "This function must be called while authenticated."
        );
      }
      const userEmail = context.auth.token.email;
      const userId = emailToId(userEmail);
      const userBoardsRef = admin
        .database()
        .ref(`/users/${userId}/whiteboards`);
      const userBoardsSnap = await userBoardsRef.once("value");
      const promises = [];

      userBoardsSnap.forEach((boardSnap) => {
        const board = boardSnap.val();
        if (board.shouldTrackVisits && board.board_members[0] === userId) {
          const promise = async () => {
            const boardDigestRef = admin
              .database()
              .ref(`/digest-logs/${boardSnap.key}`);
            const boardDigestSnap = await boardDigestRef.once("value");

            return {
              dailyLog: boardDigestSnap.val() || {},
              boardId: boardSnap.key,
              boardName: board.board_name,
            };
          };

          promises.push(promise);
        }
      });

      const digests = await pAll(promises, { concurrency: 5 });

      return digests;
    },
    { functionName: "boards-getDailyDigest" }
  )
);

exports.setBoardPassword = functions.https.onCall(
  wrapEventFunction(
    async (data, context) => {
      assertAppCheck(context);
      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "This function must be called while authenticated."
        );
      }

      const { boardId, newPassword, oldPassword } = data;

      const runner = async (userApp) => {
        const board = await getBoardById(boardId, undefined, userApp);

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt);

        if (oldPassword) {
          const isMatch = await bcrypt.compare(oldPassword, board.password);

          if (!isMatch) {
            throw new functions.https.HttpsError(
              "permission-denied",
              "the board password is invalid"
            );
          } else {
            await userApp
              .database()
              .ref(`/whiteboards/${boardId}`)
              .update({ password: hash });

            return;
          }
        } else if (board.password) {
          throw new Error("Password already exists!");
        }

        await userApp
          .database()
          .ref(`/whiteboards/${boardId}`)
          .update({ password: hash });
      };

      await runAsUser(runner, context.auth.token);
    },
    { functionName: "boards-setBoardPassword" }
  )
);

exports.unlockBoard = functions.https.onCall(
  wrapEventFunction(
    async (data, context) => {
      assertAppCheck(context);
      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "This function must be called while authenticated."
        );
      }
      const { boardId, password } = data;
      const board = await getBoardById(boardId, context.auth.token);
      const isMatch = await bcrypt.compare(password, board.password);

      if (!isMatch) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "the board password is invalid"
        );
      }

      const token = jwt.sign(
        { board_id: boardId },
        functions.config().jwt.secret_key,
        { expiresIn: "1h" }
      );

      return { token };
    },
    { functionName: "boards-unlockBoard" }
  )
);

const PASSWORD_RESET_TOKEN_ISSUER = "https://whatboard.app";

exports.resetPassword = functions.https.onCall(
  wrapEventFunction(
    async (data, context) => {
      assertAppCheck(context);
      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "This function must be called while authenticated."
        );
      }

      const { boardId } = data;
      const board = await getBoardById(boardId, context.auth.token);
      const ownerEmail = idToEmail(board.board_members[0]);
      const user = await admin.auth().getUserByEmail(ownerEmail);

      const defaultSubject = `You have requested to reset the password on the Whatboard "${board.board_name}"`;

      // When developing a template, you can set this to the version tag you are working on.
      // Once you're done, set that version tag to "active", then set this variable back
      // to "undefined".
      const templateVersion = undefined;

      const whatboardDomain = getWhatboardUrl();

      const token = jwt.sign(
        { board_id: boardId, name: "reset-password" },
        functions.config().jwt.secret_key,
        {
          expiresIn: "1h",
          issuer: PASSWORD_RESET_TOKEN_ISSUER,
          subject: user.uid,
        }
      );

      const whatboardUrl = `${whatboardDomain}/board/${boardId}/reset-token/${token}`;

      const templateVariables = {
        // eslint-disable-next-line camelcase
        display_name: user.displayName,
        // eslint-disable-next-line camelcase
        whatboard_name: board.board_name,
        // eslint-disable-next-line camelcase
        whatboard_url: whatboardUrl,
      };

      const params = {
        from: "Whatboard LLC <noreply@mg.whatboard.app>",
        to: [`${user.displayName}  <${user.email}>`],
        subject: defaultSubject,
        template: "board-reset-password",
        "t:version": templateVersion,
        "t:text": "yes",
        "o:tag": ["board-reset-password"],
        "h:X-Mailgun-Variables": JSON.stringify(templateVariables),
      };

      const mg = getMailgunClient();
      return mg.messages.create(functions.config().mailgun.domain, params);
    },
    { functionName: "boards-resetPassword" }
  )
);

exports.verifyPasswordToken = functions.https.onCall(
  wrapEventFunction(
    async (data, context) => {
      assertAppCheck(context);
      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "This function must be called while authenticated."
        );
      }

      const { boardId, token } = data;

      try {
        const decoded = jwt.verify(token, functions.config().jwt.secret_key, {
          issuer: PASSWORD_RESET_TOKEN_ISSUER,
          subject: context.auth.uid,
        });

        if (decoded.board_id === boardId) {
          const runner = async (userApp) => {
            // Ensure Board still exists
            await getBoardById(boardId, undefined, userApp);

            await userApp
              .database()
              .ref(`/whiteboards/${boardId}`)
              .update({ password: null });
          };

          await runAsUser(runner, context.auth.token);

          return { reset: true };
        }

        return { reset: false };
      } catch (err) {
        return { reset: false };
      }
    },
    { functionName: "boards-verifyPasswordToken" }
  )
);

exports.onDeleteBoardHeaderColor = functions.database
  .ref(`${dbPath}/board_header_color`)
  .onDelete(
    wrapEventFunction(async (snap) => {
      const boardSnap = await snap.ref.parent.once("value");

      if (boardSnap.exists()) {
        const board = boardSnap.val();
        const owner = await makeUserFromWbId(board.board_members[0]);
        await snap.ref.set(owner.branding.boardHeaderColor);
      }
    })
  );

exports.onDeleteBoardBodyColor = functions.database
  .ref(`${dbPath}/boardBodyColor`)
  .onDelete(
    wrapEventFunction(async (snap) => {
      const boardSnap = await snap.ref.parent.once("value");

      if (boardSnap.exists()) {
        const board = boardSnap.val();
        const owner = await makeUserFromWbId(board.board_members[0]);
        await snap.ref.set(owner.branding.boardBodyColor);
      }
    })
  );
