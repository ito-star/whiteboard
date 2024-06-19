const util = require("util");
const { v4: uuidv4 } = require("uuid");
const admin = require("firebase-admin");
const got = require("got");
const functions = require("firebase-functions");
const Mailgun = require("mailgun.js");
const formData = require("form-data");
const LRU = require("lru-cache");
const { BlockTypes, getBlockDefaults } = require("./constant");

exports.isStoredFile = (url) => {
  if (url.indexOf("armspaces.appspot.com") !== -1) {
    return true;
  }

  if (url.indexOf("whatboard-dev.appspot.com") !== -1) {
    return true;
  }

  if (
    process.env.REACT_APP_FIREBASE_STORAGE_BUCKET &&
    url.indexOf(process.env.REACT_APP_FIREBASE_STORAGE_BUCKET) !== -1
  ) {
    return true;
  }

  return false;
};

exports.getStoredFileName = (url) => {
  const urlObj = new URL(url);
  const path = decodeURIComponent(urlObj.pathname);

  const parts = path.split("/");

  return parts.pop();
};

/**
 * Tranform an email address into a user ID.
 *
 * Firebase Realtime Database does not allow periods (.) in path names. So, we replace all
 * periods found in the email address with "<>".
 */
exports.emailToId = (email) => {
  const id = email.replace(/\./g, "<>");
  return id;
};

/**
 * Transform a user ID into an email address
 *
 * This is the reverse of emailToId().
 */
exports.idToEmail = (id) => {
  const email = id.replace(/<>/g, ".");
  return email;
};

/**
 * Validate an email address
 *
 * See https://devdocs.io/html/element/input/email#Validation
 */
exports.isValidEmail = (email) => {
  const regexp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return regexp.test(email);
};

exports.underscoreToCamelCase = (str, upperCaseFirstLetter = true) => {
  let newStr = str.replace(/(_)(\p{L}{1})/gu, (match, p1, p2) => {
    return p2.toUpperCase();
  });

  if (upperCaseFirstLetter) {
    newStr = newStr.replace(/(^\p{Ll}{1})/u, (match, p1) => {
      return p1.toUpperCase();
    });
  }

  return newStr;
};

exports.stringToBool = (s) => {
  const string = String(s);

  switch (string.toLowerCase()) {
    case 1:
    case "1":
    case "true":
    case "yes":
    case "on":
      return true;
    case 0:
    case "0":
    case "false":
    case "no":
    case "off":
    default:
      return false;
  }
};

exports.isFunctionsEmulator = () => {
  return exports.stringToBool(process.env.FUNCTIONS_EMULATOR);
};

exports.isDevProject = () => {
  return process.env.GCLOUD_PROJECT === "whatboard-dev";
};

exports.isDev = () => {
  return exports.isFunctionsEmulator() || exports.isDevProject();
};

exports.createUUID = () => {
  return uuidv4();
};

exports.getWhatboardUrl = () => {
  if (exports.isFunctionsEmulator()) {
    return "http://localhost:3000";
  }

  if (exports.isDevProject()) {
    return "https://dev.whatboard.app";
  }

  return "https://whatboard.app";
};

exports.deleteFileIfExists = async (fileRef) => {
  const [exists] = await fileRef.exists();

  if (exists) {
    return fileRef.delete();
  }

  return Promise.resolve();
};

/**
 * Get a Firebase Storage File Reference from a URL
 *
 * Based on https://github.com/firebase/firebase-js-sdk/blob/17a477c123ea4447d1012f2df783986839ec9bd8/packages/storage/src/implementation/location.ts#L70
 *
 * @param {String} url
 * @returns { import("@google-cloud/storage").File || null }
 */
exports.fileFromUrl = (url) => {
  let location = null;
  const bucketDomain = "([A-Za-z0-9.\\-_]+)";

  function gsModify(loc) {
    if (loc.path.charAt(loc.path.length - 1) === "/") {
      // eslint-disable-next-line no-param-reassign
      loc.path = loc.path.slice(0, -1);
    }
  }

  const gsPath = "(/(.*))?$";
  const gsRegex = new RegExp(`^gs://${bucketDomain}${gsPath}`, "i");
  const gsIndices = { bucket: 1, path: 3 };

  function httpModify(loc) {
    // eslint-disable-next-line no-param-reassign
    loc.path = decodeURIComponent(loc.path);
  }

  const version = "v[A-Za-z0-9_]+";
  const firebaseStorageHost = "firebasestorage.googleapis.com".replace(
    /[.]/g,
    "\\."
  );
  const firebaseStoragePath = "(/([^?#]*).*)?$";
  const firebaseStorageRegExp = new RegExp(
    `^https?://${firebaseStorageHost}/${version}/b/${bucketDomain}/o${firebaseStoragePath}`,
    "i"
  );
  const firebaseStorageIndices = { bucket: 1, path: 3 };

  const cloudStorageHost =
    "(?:storage.googleapis.com|storage.cloud.google.com)";
  const cloudStoragePath = "([^?#]*)";
  const cloudStorageRegExp = new RegExp(
    `^https?://${cloudStorageHost}/${bucketDomain}/${cloudStoragePath}`,
    "i"
  );
  const cloudStorageIndices = { bucket: 1, path: 2 };

  const groups = [
    { regex: gsRegex, indices: gsIndices, postModify: gsModify },
    {
      regex: firebaseStorageRegExp,
      indices: firebaseStorageIndices,
      postModify: httpModify,
    },
    {
      regex: cloudStorageRegExp,
      indices: cloudStorageIndices,
      postModify: httpModify,
    },
  ];

  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const captures = group.regex.exec(url);

    if (captures) {
      const bucketValue = captures[group.indices.bucket];
      let pathValue = captures[group.indices.path];

      if (!pathValue) {
        pathValue = "";
      }

      location = { bucket: bucketValue, path: pathValue };
      group.postModify(location);
      break;
    }
  }

  if (location == null) {
    return null;
  }

  const defaultBucket = admin.app().options.storageBucket;

  if (location.bucket !== defaultBucket) {
    return null;
  }

  return admin.storage().bucket(location.bucket).file(location.path);
};

const getBlockUrlProp = (block) => {
  const filesProps = {
    [BlockTypes.Image]: "image_path",
    [BlockTypes.PDF]: "pdf_path",
  };
  const filesProp = filesProps[block.type];

  return filesProp;
};

exports.getBlockUrlProp = getBlockUrlProp;

const getBlockFilesProp = (block) => {
  const filesProps = {
    [BlockTypes.Image]: "imageFiles",
    [BlockTypes.PDF]: "pdfFiles",
    [BlockTypes.Files]: "files",
    [BlockTypes.Text]: "textEditorFiles",
    [BlockTypes.FileRequest]: "fileRequestFiles",
    [BlockTypes.Grid]: "gridFiles",
  };
  const filesProp = filesProps[block.type];

  return filesProp;
};

exports.getBlockFilesProp = getBlockFilesProp;

const getBlockFilesDefault = (block) => {
  const filesProp = getBlockFilesProp(block);
  const blockDefaults = getBlockDefaults();

  return blockDefaults[filesProp];
};

exports.getBlockFilesDefault = getBlockFilesDefault;

const getBlockFiles = (block) => {
  const filesProp = getBlockFilesProp(block);

  if (block[filesProp]) {
    return block[filesProp];
  }

  return getBlockFilesDefault(block);
};

exports.getBlockFiles = getBlockFiles;

/**
 * Creates filter function that filters files that were (not) uploaded by the given user
 *
 * This function creates a callback function for array.filter() that selects only
 * the files that were (not) uploaded by the given user.
 *
 * @param {String} userId
 * @param {Boolean} invert
 */
exports.createUserFilesFilter = (userId, invert = false) => {
  return (file) => {
    const isUploadedByUser = file.createdBy === userId;

    if (invert) {
      return !isUploadedByUser;
    }

    return isUploadedByUser;
  };
};

/**
 * Creates a filter function that filters files that are (not) actual uploaded files
 *
 * This function creates a callback function for array.filter() that selects only
 * the files that are (not) actual uploaded files (as opposed to "external" files which
 * mimic the appearance and functionality of uploaded files, but have not actually been
 * uploaded to Whatboard file storage).
 *
 * @param {Boolean} invert
 */
exports.createUploadedFilesFilter = (invert = false) => {
  return (file) => {
    const isUploadedFile = !!file.storagePath;

    if (invert) {
      return !isUploadedFile;
    }

    return isUploadedFile;
  };
};

exports.debug = (obj, options) => {
  console.log(
    util.inspect(obj, {
      colors: true,
      depth: 10,
      compact: false,
      ...options,
    })
  );
};

exports.makeBoardUrl = (boardId) => {
  return `${exports.getWhatboardUrl()}/board/${boardId}`;
};

exports.makeBoardPublicUrl = (boardId, uniqueUrlHash) => {
  return `${exports.getWhatboardUrl()}/readonlyboard/${boardId}?invitation=${uniqueUrlHash}`;
};

exports.makeBoardFriendlyUrl = (friendlyUrl) => {
  return `${exports.getWhatboardUrl()}/b/${friendlyUrl}`;
};

exports.runAsUser = async (runner, idToken) => {
  const appOptions = JSON.parse(process.env.FIREBASE_CONFIG);
  appOptions.databaseAuthVariableOverride = {
    uid: idToken.sub,
    token: idToken,
  };
  const app = admin.initializeApp(appOptions, exports.createUUID());
  const deleteApp = () => app.delete().catch(() => null);

  try {
    const result = await runner(app);

    await deleteApp();

    return result;
  } catch (error) {
    await deleteApp();

    throw error;
  }
};

exports.httpToHttps = async (url) => {
  const urlObj = new URL(url);

  if (urlObj.protocol !== "http:") {
    return url;
  }

  try {
    urlObj.protocol = "https:";

    await got({
      url: urlObj,
      method: "HEAD",
      followRedirect: false,
      throwHttpErrors: false,
    });

    return urlObj.toString();
  } catch (e) {
    return url;
  }
};

exports.assertAppCheck = (context) => {
  // context.app will be undefined if the request doesn't include a valid
  // App Check token.
  if (!context.app) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "The function must be called from an App Check verified app."
    );
  }
};

const mailgun = new Mailgun(formData);
let mailgunClient;

/**
 * @returns {import("mailgun.js/client").default}
 */
exports.getMailgunClient = () => {
  if (mailgunClient === undefined) {
    mailgunClient = mailgun.client({
      username: "api",
      key: functions.config().mailgun.api_key,
    });
  }

  return mailgunClient;
};

exports.getCache = () => new LRU({ max: 500 });
