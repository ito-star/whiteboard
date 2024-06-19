const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { encodeFilePath } = require("./file-usage");
const { wrapEventFunction } = require("./sentry");

exports.onMetadataUpdate = functions.storage.object().onMetadataUpdate(
  wrapEventFunction(async (objectMetadata) => {
    const { firebaseStorageDownloadTokens, uploaderWbid } =
      objectMetadata.metadata || {};

    if (!firebaseStorageDownloadTokens || !uploaderWbid) {
      return;
    }

    const dbPath = `/files/${uploaderWbid}/${encodeFilePath(
      objectMetadata.name
    )}`;
    const fileObjRef = admin.database().ref(dbPath);
    const fileObjSnap = await fileObjRef.once("value");
    const fileObj = fileObjSnap.val();

    if (!fileObj) {
      return;
    }

    const tokens = firebaseStorageDownloadTokens.split(",");
    const latestToken = tokens[tokens.length - 1];

    const fileUrl = new URL(fileObj.filePath);
    const storedToken = fileUrl.searchParams.get("token");

    if (latestToken === storedToken) {
      return;
    }

    const filePathRef = fileObjRef.child("filePath");
    await filePathRef.transaction((filePath) => {
      if (filePath) {
        const urlObj = new URL(filePath);
        urlObj.searchParams.set("token", latestToken);

        return urlObj.toString();
      }

      return filePath;
    });
  })
);
