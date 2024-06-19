const admin = require("firebase-admin");
const _ = require("lodash");

const { createUploadedFilesFilter } = require("./utils");

const encodeFilePath = (path) => {
  return encodeURIComponent(path).replace(/\./g, "%2E");
};

exports.encodeFilePath = encodeFilePath;

exports.getFile = async (userId, path) => {
  if (!userId) {
    throw new Error("Missing user ID");
  }

  if (!path) {
    throw new Error("Missing file path");
  }

  const fileId = encodeFilePath(path);
  const snap = await admin
    .database()
    .ref(`/files/${userId}/${fileId}`)
    .once("value");

  let file;

  if (snap.exists()) {
    file = {
      ...snap.val(),
      id: snap.key,
    };
  }

  return file;
};

exports.saveFile = async (file) => {
  const savedFile =
    (await exports.getFile(file.createdBy, file.storagePath)) || {};
  const fileId = savedFile.id || encodeFilePath(file.storagePath);

  const updates = {};

  _.forEach(file, (value, key) => {
    if (value !== savedFile[key]) {
      updates[key] = value;
    }
  });

  return admin
    .database()
    .ref(`/files/${file.createdBy}/${fileId}`)
    .update(updates);
};

exports.addFileUsage = async (file, type, id, count = 1) => {
  const fileId = encodeFilePath(file.storagePath);
  const basePath = `/files/${file.createdBy}/${fileId}/usage`;

  await admin
    .database()
    .ref(`${basePath}/${type}/${id}`)
    .transaction((usage) => {
      return usage + count;
    });
};

exports.removeFileUsage = async (file, type, id, count = 1) => {
  const storedFile = await exports.getFile(file.createdBy, file.storagePath);

  if (storedFile) {
    const basePath = `/files/${file.createdBy}/${storedFile.id}/usage`;

    await admin
      .database()
      .ref(`${basePath}/${type}/${id}`)
      .transaction((usage) => {
        const newUsage = Math.max(0, usage - count);

        return newUsage || null;
      });
  }
};

exports.processFileUsage = async (files, prevFiles, type, id) => {
  const uploadedFilesFilter = createUploadedFilesFilter();

  const beforeFiles = _.filter(prevFiles, uploadedFilesFilter);

  const afterFiles = _.filter(files, uploadedFilesFilter);

  const toDelete = _.differenceBy(beforeFiles, afterFiles, "storagePath");
  const toAdd = _.differenceBy(afterFiles, beforeFiles, "storagePath");

  const promises = [];

  // Uploading the same file
  _.intersectionBy(files, prevFiles, "storagePath").forEach((file) => {
    promises.push(exports.saveFile(file));
  });

  promises.concat(
    toDelete.map((file) => {
      return exports.removeFileUsage(file, type, id);
    })
  );

  promises.concat(
    toAdd.map(async (file) => {
      await exports.saveFile(file);
      return exports.addFileUsage(file, type, id);
    })
  );

  await Promise.all(promises);
};
