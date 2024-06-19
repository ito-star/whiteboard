const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const path = require("path");
const helmet = require("helmet");
const crypto = require("crypto");
const buttonWebhook = require("./buttonhook");

const {
  underscoreToCamelCase,
  getWhatboardUrl,
  isFunctionsEmulator,
  runAsUser,
  httpToHttps,
  idToEmail,
  assertAppCheck,
  isDev,
} = require("./utils");

const { makeUser } = require("./access");

const { processFileUsage } = require("./file-usage");

const { wrapEventFunction, wrapHttpFunction } = require("./sentry");

const dbPath = "/blocks/{board_id}/{block_id}";

const fileFields = [
  "files",
  "imageFiles",
  "pdfFiles",
  "textEditorFiles",
  "fileRequestFiles",
  "gridFiles",
];

const BOARDS_USAGE_TYPE = "boards";

const makeUsageId = (board_id, block_id) => {
  const usageId = `${board_id}/${block_id}`;
  return usageId;
};

let usageInitRunning;

const isUsageInit = async () => {
  if (isFunctionsEmulator() || usageInitRunning === undefined) {
    const snap = await admin.database().ref("file-usage-init").once("value");
    usageInitRunning = snap.exists();
  }

  return usageInitRunning;
};

// eslint-disable-next-line no-unused-vars
const handleFileCreate = async (snap, context, fileField) => {
  if (await isUsageInit()) {
    return;
  }

  const { board_id, block_id } = context.params;
  const usageId = makeUsageId(board_id, block_id);
  const files = snap.val() || [];

  await processFileUsage(files, [], BOARDS_USAGE_TYPE, usageId);
};

// eslint-disable-next-line no-unused-vars
const handleFileUpdate = async (change, context, fileField) => {
  if (await isUsageInit()) {
    return;
  }

  const { board_id, block_id } = context.params;
  const usageId = makeUsageId(board_id, block_id);

  const prevFiles = change.before.val() || [];
  const files = change.after.val() || [];

  await processFileUsage(files, prevFiles, BOARDS_USAGE_TYPE, usageId);
};

// eslint-disable-next-line no-unused-vars
const handleFileDelete = async (snap, context, fileField) => {
  if (await isUsageInit()) {
    return;
  }

  const { board_id, block_id } = context.params;
  const usageId = makeUsageId(board_id, block_id);

  const files = snap.val() || [];

  await processFileUsage([], files, BOARDS_USAGE_TYPE, usageId);
};

fileFields.forEach((field) => {
  const fieldPath = `${dbPath}/${field}`;

  const writeFuncName = `onWrite${underscoreToCamelCase(field)}`;
  exports[writeFuncName] = functions.database.ref(fieldPath).onWrite(
    wrapEventFunction((change, context) => {
      const beforeSnap = change.before;
      const afterSnap = change.after;

      if (!beforeSnap.exists()) {
        return handleFileCreate(afterSnap, context, field);
      }

      if (!afterSnap.exists()) {
        return handleFileDelete(beforeSnap, context, field);
      }

      return handleFileUpdate(change, context, field);
    })
  );
});

exports.onDelete = functions.database.ref(dbPath).onDelete(
  wrapEventFunction(async (snap, context) => {
    const { board_id, block_id } = context.params;

    await snap.ref.root.child(`chats/${board_id}/${block_id}`).remove();
  })
);

const getBlockAsUser = async (boardId, blockId, idToken) => {
  const runner = async (userApp) => {
    return userApp.database().ref(`blocks/${boardId}/${blockId}`).once("value");
  };

  const blockSnap = await runAsUser(runner, idToken);

  return blockSnap;
};

const embedScriptsViewerApp = express();
embedScriptsViewerApp.set("view engine", "ejs");
embedScriptsViewerApp.set("views", path.join(__dirname, "views"));

embedScriptsViewerApp.use((req, res, next) => {
  res.locals.cspNonce = crypto.randomBytes(16).toString("hex");
  next();
});

embedScriptsViewerApp.use(
  helmet({
    frameguard: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: helmet.contentSecurityPolicy.dangerouslyDisableDefaultSrc,
        baseUri: ["'none'"],
        frameAncestors: [getWhatboardUrl()],
        objectSrc: ["'none'"],
      },
    },
  })
);

embedScriptsViewerApp.get("/", async (req, res, next) => {
  try {
    let basePath = "";

    if (isFunctionsEmulator()) {
      basePath = `/${process.env.GCLOUD_PROJECT}/us-central1`;
    }

    res.render("blocks/script-embed-viewer.ejs", {
      whatboardUrl: getWhatboardUrl(),
      basePath,
    });

    next();
  } catch (e) {
    next(e);
  }
});

exports.embedScriptsViewer = functions
  .runWith({ minInstances: isDev() ? 0 : 5 })
  .https.onRequest(async (req, res) => {
    embedScriptsViewerApp(req, res);
  });

exports.viewEmbedScripts = functions
  .runWith({ minInstances: isDev() ? 0 : 5 })
  .https.onRequest(
    wrapHttpFunction(async (req, res) => {
      const { blockId, boardId } = req.query;
      let idToken;
      let blockSnap;

      try {
        if (
          !req.headers.authorization ||
          !req.headers.authorization.startsWith("Bearer ")
        ) {
          throw new Error("No access token provided");
        }

        const accessToken = req.headers.authorization.split("Bearer ")[1];

        if (!accessToken) {
          throw new Error("No access token provided");
        }

        idToken = await admin.auth().verifyIdToken(accessToken);
      } catch (error) {
        res.status(401).send(error.message);
        return;
      }

      if (!blockId) {
        res.status(400).send("BlockId required");
        return;
      }

      if (!boardId) {
        res.status(400).send("BoardId required");
        return;
      }

      try {
        blockSnap = await getBlockAsUser(boardId, blockId, idToken);
      } catch (error) {
        if (error.code === "PERMISSION_DENIED") {
          res.status(403).send("Permission Denied");
        } else {
          res.status(500).send(error.message);
        }

        return;
      }

      if (!blockSnap.exists()) {
        res.status(404).send("block not found");
        return;
      }

      const block = blockSnap.val();

      res.set("Content-Type", "text/html");
      res.status(200);
      res.send(block.scriptEmbed);
    })
  );

exports.callButtonWebhook = functions.https.onCall(
  wrapEventFunction(
    async (data, context) => {
      assertAppCheck(context);
      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "This function must be called while authenticated."
        );
      }

      const { boardId, blockId, buttonId } = data;

      if (!boardId) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          'The "boardId" field is required.'
        );
      }

      if (!blockId) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          'The "blockId" field is required.'
        );
      }

      if (!buttonId) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          'The "buttonId" field is required.'
        );
      }

      let board;
      let block;
      let button;

      try {
        const runner = async (userApp) => {
          const boardSnap = await userApp
            .database()
            .ref(`/whiteboards/${boardId}`)
            .once("value");

          if (!boardSnap.exists()) {
            throw new Error("board-not-found");
          }

          board = boardSnap.val();

          const blockSnap = await userApp
            .database()
            .ref(`blocks/${boardId}/${blockId}`)
            .once("value");

          if (!blockSnap.exists()) {
            throw new Error("block-not-found");
          }

          block = blockSnap.val();

          button = (block.buttons || []).find((candidate) => {
            return candidate.id === buttonId;
          });

          if (!button) {
            throw new Error("button-not-found");
          }
        };

        await runAsUser(runner, context.auth.token);
      } catch (error) {
        if (error.message === "board-not-found") {
          throw new functions.https.HttpsError(
            "not-found",
            `Cannot find Whatboard with ID "${boardId}".`
          );
        }

        if (error.message === "block-not-found") {
          throw new functions.https.HttpsError(
            "not-found",
            `Cannot find Block with ID "${blockId}" in Whatboard with ID "${boardId}".`
          );
        }

        if (error.message === "button-not-found") {
          throw new functions.https.HttpsError(
            "not-found",
            `Cannot find Button with ID "${buttonId}" in Block with ID "${blockId}" in Whatboard with ID "${boardId}".`
          );
        }

        if (error.code === "PERMISSION_DENIED") {
          throw new functions.https.HttpsError(
            "permission-denied",
            "You do not have permission to access this Whatboard"
          );
        } else {
          throw new functions.https.HttpsError("unknown", error.message);
        }
      }

      return buttonWebhook(
        boardId,
        board,
        block,
        button,
        context.auth.token.email
      );
    },
    { functionName: "blocks-callButtonWebhook" }
  )
);

exports.httpToHttps = functions.https.onCall(
  wrapEventFunction(
    async (data, context) => {
      assertAppCheck(context);
      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "This function must be called while authenticated."
        );
      }

      const { url } = data;

      if (!url) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          'The "boardId" field is required.'
        );
      }

      return httpToHttps(url);
    },
    { functionName: "blocks-httpToHttps" }
  )
);

exports.getCreatorInfo = functions
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

        const { boardId, blockId } = data;

        if (!boardId) {
          throw new functions.https.HttpsError(
            "invalid-argument",
            'The "boardId" field is required.'
          );
        }

        if (!blockId) {
          throw new functions.https.HttpsError(
            "invalid-argument",
            'The "blockId" field is required.'
          );
        }

        let block;

        try {
          const runner = async (userApp) => {
            const boardSnap = await userApp
              .database()
              .ref(`/whiteboards/${boardId}`)
              .once("value");

            if (!boardSnap.exists()) {
              throw new Error("board-not-found");
            }

            const blockSnap = await userApp
              .database()
              .ref(`blocks/${boardId}/${blockId}`)
              .once("value");

            if (!blockSnap.exists()) {
              throw new Error("block-not-found");
            }

            block = blockSnap.val();
          };

          await runAsUser(runner, context.auth.token);
        } catch (error) {
          if (error.message === "board-not-found") {
            throw new functions.https.HttpsError(
              "not-found",
              `Cannot find Whatboard with ID "${boardId}".`
            );
          }

          if (error.message === "block-not-found") {
            throw new functions.https.HttpsError(
              "not-found",
              `Cannot find Block with ID "${blockId}" in Whatboard with ID "${boardId}".`
            );
          }

          if (error.code === "PERMISSION_DENIED") {
            throw new functions.https.HttpsError(
              "permission-denied",
              "You do not have permission to access this Whatboard"
            );
          } else {
            throw new functions.https.HttpsError("unknown", error.message);
          }
        }

        const creatorEmail = idToEmail(block.created_by);
        const createFirebaseUser = await admin
          .auth()
          .getUserByEmail(creatorEmail);
        const creator = await makeUser(createFirebaseUser);

        creator.providerData = [];

        return creator;
      },
      { functionName: "blocks-getCreatorInfo" }
    )
  );
