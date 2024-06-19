const path = require("path");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const pProps = require("p-props");
const _ = require("lodash");

const {
  deleteFileIfExists,
  isFunctionsEmulator,
  getBlockFilesProp,
  getBlockUrlProp,
  getBlockFiles,
  assertAppCheck,
  fileFromUrl,
} = require("./utils");

const { wrapEventFunction } = require("./sentry");

const dbPath = "/files/{user_id}/{file_id}";

let usageInitRunning;

const isUsageInit = async () => {
  if (isFunctionsEmulator() || usageInitRunning === undefined) {
    const snap = await admin.database().ref("file-usage-init").once("value");
    usageInitRunning = snap.exists();
  }

  return usageInitRunning;
};

const handleCreateFile = async (snap, context) => {
  if (await isUsageInit()) {
    return;
  }

  const { user_id } = context.params;
  const file = snap.val();

  const storageUsageRef = admin
    .database()
    .ref(`metadata/${user_id}/usage/storage`);

  await storageUsageRef.transaction((bytes) => {
    return bytes + file.fileSize;
  });
};

const handleUpdateFile = async (change) => {
  const before = change.before.val();
  const after = change.after.val();

  if (!after.usage) {
    return;
  }

  const fields = ["fileName", "filePath", "fileSize", "fileType", "uploadDate"];

  const fileChanged = {};

  fields.forEach((field) => {
    if (after[field] !== before[field]) {
      fileChanged[field] = after[field];
    }
  });

  if (!Object.keys(fileChanged).length) {
    return;
  }

  const updates = {};

  await pProps(after.usage, async (usage, type) => {
    switch (type) {
      case "boards":
        return pProps(usage, async (blocks, boardId) => {
          return pProps(blocks, async (count, blockId) => {
            const blockPath = `/blocks/${boardId}/${blockId}`;
            const blockSnap = await admin
              .database()
              .ref(blockPath)
              .once("value");

            if (blockSnap.exists()) {
              const block = blockSnap.val();
              const filesProp = getBlockFilesProp(block);
              _.forEach(getBlockFiles(block), (blockFile, index) => {
                if (blockFile.storagePath === after.storagePath) {
                  _.forEach(fileChanged, (value, key) => {
                    if (value !== blockFile[key]) {
                      updates[
                        `${blockPath}/${filesProp}/${index}/${key}`
                      ] = value;

                      if (key === "filePath") {
                        const urlProp = getBlockUrlProp(block);

                        if (urlProp) {
                          updates[`${blockPath}/${urlProp}`] = value;
                        }
                      }
                    }
                  });
                }
              });
            }
          });
        });
      default:
        break;
    }

    return Promise.resolve();
  });

  await admin.database().ref().update(updates);
};

const handleDeleteFile = async (snap, context) => {
  if (await isUsageInit()) {
    return;
  }

  const { user_id } = context.params;
  const file = snap.val();

  const storageUsageRef = admin
    .database()
    .ref(`metadata/${user_id}/usage/storage`);

  await storageUsageRef.transaction((bytes) => {
    return Math.max(0, bytes - file.fileSize);
  });

  const fileRef = admin.storage().bucket().file(file.storagePath);
  await deleteFileIfExists(fileRef);
};

exports.onWrite = functions.database.ref(dbPath).onWrite(
  wrapEventFunction((change, context) => {
    const beforeSnap = change.before;
    const afterSnap = change.after;

    if (!beforeSnap.exists()) {
      return handleCreateFile(afterSnap, context);
    }

    if (!afterSnap.exists()) {
      return handleDeleteFile(beforeSnap, context);
    }

    return handleUpdateFile(change, context);
  })
);

exports.onUsageDelete = functions.database.ref(`${dbPath}/usage`).onDelete(
  wrapEventFunction(async (snap) => {
    if (await isUsageInit()) {
      return;
    }

    const fileSnap = await snap.ref.parent.once("value");

    if (fileSnap.exists()) {
      fileSnap.ref.remove();
    }
  })
);

exports.getDownloadUrl = functions.https.onCall(
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
          'The "storagePath" field is required.'
        );
      }

      const fileRef = fileFromUrl(url);
      let downloadUrl;

      if (!fileRef) {
        downloadUrl = url;
      } else {
        const [exists] = await fileRef.exists();

        if (!exists) {
          throw new functions.https.HttpsError(
            "not-found",
            `Cannot find File with path "${fileRef.name}"`
          );
        }

        const [metadata] = await fileRef.getMetadata();

        const fileName =
          (metadata.metadata && metadata.metadata.originalFileName) ||
          path.basename(metadata.name);

        [downloadUrl] = await fileRef.getSignedUrl({
          action: "read",
          version: "v4",
          promptSaveAs: fileName,
          // Expires in 1 hour
          expires: Date.now() + 3600000,
        });
      }

      return { downloadUrl };
    },
    { functionName: "files-getDownloadUrl" }
  )
);
