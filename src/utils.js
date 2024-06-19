import firebase from "firebase/compat/app";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from "firebase/app-check";
import "firebase/compat/analytics";
import "firebase/compat/database";
import "firebase/compat/functions";
import "firebase/compat/storage";
import {
  getStorage,
  ref as storageRef,
  getDownloadURL,
} from "firebase/storage";
import { useLocation } from "react-router-dom";
import { createPath } from "history";
import { v4 as uuidv4 } from "uuid";
import _isEmpty from "lodash/isEmpty";
import _toPairs from "lodash/toPairs";
import _isPlainObject from "lodash/isPlainObject";
import _fromPairs from "lodash/fromPairs";
import _isNumber from "lodash/isNumber";
import _iteratee from "lodash/iteratee";
import _isString from "lodash/isString";
import _orderBy from "lodash/orderBy";
import _keyBy from "lodash/keyBy";
import Quill from "quill";
import {
  extractFiles as baseExtractFiles,
  isExtractableFile,
} from "extract-files";
import isObjectUrl from "@uppy/utils/lib/isObjectURL";
import { saveAs } from "file-saver";
import axios from "axios";
import Dayjs from "dayjs";
import objectComb from "object-comb";
import LinkifyIt from "linkify-it";
import tlds from "tlds";
import {
  BlockTypes,
  dataPathPerType,
  minDeviceWidth,
  boardColors,
  getBlockDefaults,
  ThemeColors,
} from "./constant";
import QuillImageBlotSpec from "./QuillImageBlotSpec";
import getFirebaseFunctionsUrl from "./firebase-functions-url";

export { default as getFirebaseFunctionsUrl } from "./firebase-functions-url";

const JSZip = require("jszip");

const Font = Quill.import("formats/font");
Font.whitelist = ["times-new-roman", "arial"];
Quill.register(Font, true);
/**
 * Custom hook for retrieving the query paramaters of
 * the page URL
 */
export const useQueryParams = () => {
  return new URLSearchParams(useLocation().search);
};

export const getQueryParams = (queryName) => {
  return new URLSearchParams(window.location.search).get(queryName);
};

export const cleanDestination = (destination) => {
  let clean;

  const destUrl = new URL(destination, window.location.origin);

  if (destUrl.origin === window.location.origin) {
    clean = {
      pathname: destUrl.pathname,
      search: destUrl.search,
      hash: destUrl.hash,
    };
  } else {
    clean = {
      pathname: "/",
    };
  }

  return clean;
};

/**
 * Custom hook to retrieve the value of the "destination"
 * query parameter.
 *
 * The return value will be properly sanitized to prevent
 * open redirect vulernabilities.
 */
export const useDestination = () => {
  const queryParams = useQueryParams();
  const location = useLocation();

  let destination;

  if (queryParams.get("destination")) {
    destination = cleanDestination(queryParams.get("destination"));
  } else {
    destination = location;
  }

  return destination;
};

export const isEmailSpecial = (email) => {
  return (
    email.endsWith("@rossmach.com") ||
    email.endsWith("@alanross.biz") ||
    email === "danjkim11@gmail.com"
  );
};

export const isBlockTypeEmpty = (block, blockType) => {
  const blockData = block[dataPathPerType[blockType]];

  if (blockType === BlockTypes.Conversation) {
    return false;
  }

  if (blockType === BlockTypes.FileRequest) {
    return false;
  }

  if (_isEmpty(blockData)) {
    return true;
  }

  return false;
};

export const containsDataForBlockType = (blockType, blockData) => {
  const {
    webhookURL,
    useButtonWebhook,
    qa_data,
    iframe_url,
    data,
    scriptEmbed,
    buttons,
  } = blockData;
  const questionList = qa_data.map(({ question }) => question);
  const isQuestionDuplicated =
    new Set(questionList).size !== questionList.length;
  let message;

  if (blockType === BlockTypes.QAForm) {
    if (qa_data[0].question === "") {
      message = "Please add a question title.";
    }
    if (isQuestionDuplicated) {
      message = "Questions should be unique.";
    }
  }

  if (blockType === BlockTypes.Checklist) {
    if (!data[0]) {
      message = "Please add a checklist item.";
    }
    if (data[0] && data[0].text === "") {
      message = "Please add a checklist name.";
    }
  }

  if (blockType === BlockTypes.Iframe && iframe_url === "") {
    message = "Please provide a URL";
  }

  if (blockType === BlockTypes.Buttons) {
    if (useButtonWebhook && webhookURL === "") {
      message = "Please provide a Webhook URL";
    } else if (!buttons) {
      message = "Please add a button";
    }
  }

  if (blockType === BlockTypes.ScriptEmbed) {
    if (scriptEmbed === "") {
      message = "Please provide a Scrimpt Embed URL";
    }
  }

  return message;
};

/**
 * Options for Board metadata updates
 *
 * @typedef {Object} BoardMetadataUpdateOptions
 * @property {Date} [currentDate]
 * @property {boolean} [updateLastViewed=true]
 * @property {boolean} [updateLastModified=true]
 */

/**
 *
 * @param {string} boardId
 * @param {string} userId
 * @param {BoardMetadataUpdateOptions} [options]
 * @returns {Object}
 */
export const makeBoardMetadataUpdate = (boardId, userId, options = {}) => {
  const {
    currentDate = new Date(),
    updateLastViewed = true,
    updateLastModified = true,
  } = options;

  const boardMembersPath = `whiteboards/${boardId}/view_logs/${userId}`;
  const boardsMetaDataPath = `whiteboards/${boardId}/metadata`;
  const dateStr = currentDate.toJSON();

  const updates = {};

  if (updateLastViewed && userId) {
    updates[`${boardMembersPath}/lastViewed`] = dateStr;
  }

  if (updateLastModified) {
    if (userId) {
      updates[`${boardMembersPath}/lastModified`] = dateStr;
    }

    updates[`${boardsMetaDataPath}/lastModified`] = dateStr;
  }

  return updates;
};

/**
 *
 * @param {string} boardId
 * @param {string} userId
 * @param {BoardMetadataUpdateOptions} [options]
 * @returns {Promise}
 */
export const updateBoardMetadata = async (boardId, userId, options = {}) => {
  const updates = makeBoardMetadataUpdate(boardId, userId, options);

  return firebase.database().ref().update(updates);
};

/**
 * Options for Block metadata updates
 *
 * @typedef {Object} BlockMetadataUpdateOptions
 * @property {Date} [currentDate]
 * @property {boolean} [updateLastViewed=true]
 * @property {boolean} [updateLastModified=true]
 */

/**
 *
 * @param {string} boardId
 * @param {string} blockId
 * @param {string} userId
 * @param {BlockMetadataUpdateOptions} [options]
 * @returns {Object}
 */
export const makeBlockMetadataUpdate = (
  boardId,
  blockId,
  userId,
  options = {}
) => {
  const {
    currentDate = new Date(),
    updateLastViewed = true,
    updateLastModified = true,
  } = options;

  const metadataPath = `blocks/${boardId}/${blockId}/metadata`;
  const dateStr = currentDate.toJSON();

  const updates = {};

  if (updateLastViewed && userId) {
    updates[`${metadataPath}/lastViewed/${userId}`] = dateStr;
  }

  if (updateLastModified) {
    updates[`${metadataPath}/lastModified`] = dateStr;
  }

  return updates;
};

/**
 *
 * @param {string} boardId
 * @param {string} blockId
 * @param {string} userId
 * @param {BlockMetadataUpdateOptions} [options]
 * @returns {Promise}
 */
export const updateBlockMetadata = async (
  boardId,
  blockId,
  userId,
  options = {}
) => {
  const updates = makeBlockMetadataUpdate(boardId, blockId, userId, options);

  return firebase.database().ref().update(updates);
};

/**
 *
 * @param {string} boardId
 * @param {string} blockId
 * @param {string} userId
 * @param {Object} [options]
 * @param {BoardMetadataUpdateOptions} [options.board]
 * @param {BlockMetadataUpdateOptions} [options.block]
 * @returns {Object}
 */
export const makeBoardBlockMetadataUpdate = (
  boardId,
  blockId,
  userId,
  options = {}
) => {
  const { board: boardOptions = {}, block: blockOptions = {} } = options;

  const currentDate = new Date();

  const updates = {
    ...makeBoardMetadataUpdate(boardId, userId, {
      currentDate,
      ...boardOptions,
    }),
    ...makeBlockMetadataUpdate(boardId, blockId, userId, {
      currentDate,
      ...blockOptions,
    }),
  };

  return updates;
};

/**
 *
 * @param {string} boardId
 * @param {string} blockId
 * @param {string} userId
 * @param {Object} [options]
 * @param {BoardMetadataUpdateOptions} [options.board]
 * @param {BlockMetadataUpdateOptions} [options.block]
 * @returns {Promise}
 */
export const updateBoardBlockMetadata = async (
  boardId,
  blockId,
  userId,
  options = {}
) => {
  const updates = makeBoardBlockMetadataUpdate(
    boardId,
    blockId,
    userId,
    options
  );

  return firebase.database().ref().update(updates);
};

export const makeUrl = (history, path) => {
  const href = history.createHref(path);
  const url = new URL(href, window.location.origin);

  return url;
};

export const createUUID = () => {
  return uuidv4();
};

export const makeConfirmEmailVerifiedUrl = (history, destination = {}) => {
  const url = {
    pathname: "/confirm-email-verified",
  };

  let destPath;

  if (
    destination.pathname === "/login" ||
    destination.pathname === "/signup" ||
    destination.pathname === "/sign-in-success"
  ) {
    destPath = createPath({
      pathname: "/",
    });
  } else {
    destPath = createPath(destination);
  }

  const searchParams = new URLSearchParams();
  searchParams.set("destination", destPath);
  url.search = `?${searchParams}`;

  const urlStr = makeUrl(history, url).toString();

  return urlStr;
};

/**
 * Tranform an email address into a user ID.
 *
 * Firebase Realtime Database does not allow periods (.) in path names. So, we replace all
 * periods found in the email address with "<>".
 */
export const emailToId = (email) => {
  return email.replace(/\./g, "<>");
};

/**
 * Transform a user ID into an email address
 *
 * This is the reverse of email_to_id().
 */
export const idToEmail = (id) => {
  return id.replace(/<>/g, ".");
};

export function initFirebase() {
  const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
  };

  if (firebase.apps.length === 0) {
    const app = firebase.initializeApp(firebaseConfig);

    if (process.env.NODE_ENV === "production") {
      firebase.analytics();
    }

    if (process.env.REACT_APP_FIREBASE_APPCHECK_DEBUG_TOKEN) {
      window.FIREBASE_APPCHECK_DEBUG_TOKEN =
        process.env.REACT_APP_FIREBASE_APPCHECK_DEBUG_TOKEN;
    }

    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(
        process.env.REACT_APP_RECAPTCHA_ENTERPRISE_SITE_KEY
      ),
      isTokenAutoRefreshEnabled: true,
    });
  }
}

/**
 * Retrieve a callable Firebase Cloud Function
 *
 * This also takes care of configuring Firebase to use the local Firebase Functions Emulator
 * when appropriate
 */
export const getCallableFbFunction = (name) => {
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname.endsWith(".ngrok.io")
  ) {
    firebase.functions().useFunctionsEmulator("http://localhost:5001");
  }

  return firebase.functions().httpsCallable(name);
};

export const isMobile = () => {
  return window.innerWidth < 768;
};

export const getEditorModules = () => {
  return {
    toolbar: { container: "#toolbar" },
    blotFormatter: {
      specs: [QuillImageBlotSpec],
    },
  };
};

export const getEditorFormats = () => {
  return [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "image",
    "list",
    "bullet",
    "align",
    "indent",
    "link",
    "color",
    "background",
    "font",
    "size",
  ];
};

export const formatAMPM = (date) => {
  let hours = date.getHours();
  let minutes = date.getMinutes();
  const ampm = hours >= 12 ? "pm" : "am";
  hours %= 12;
  hours = hours || 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? `0${minutes}` : minutes;
  const strTime = `${hours}:${minutes}${ampm}`;
  return strTime;
};

export const makeDbUpdateObj = (value, prefix = "") => {
  const makePairs = (obj, prefixIndex) => {
    let pairs = [];

    _toPairs(obj).forEach((pair) => {
      const [key, values] = pair;
      const prefixedKey = `${prefixIndex}/${key}`;
      if (_isPlainObject(values)) {
        pairs = pairs.concat(makePairs(values, prefixedKey));
      } else {
        pairs.push([prefixedKey, values]);
      }
    });

    return pairs;
  };

  const entries = makePairs(value, prefix);

  return _fromPairs(entries);
};

export const mbToBytes = (mb) => {
  return mb * 1024 * 1024;
};

export const scrollToRefObject = (ref) => {
  window.scrollTo({
    top: ref.current.offsetTop,
    left: 0,
    behavior: "smooth",
  });
};

/**
 * Converts a Firebase Realtime Database collection into an `Array`
 *
 * Collections in Firebase Realtime Database come in two forms:
 *
 * 1. `Array`s
 * 2. `Object`s with keys that are IDs generated by Firebase Realtime Database.
 *    This is kind that gets created when you do `firebase.database().ref('foobar').push()`.
 *
 * Type #1 is returned as an `Array`. Type #2 is returned as an `Object`. This function
 * ensures that we can work with each type of collection as an `Array`.
 *
 * @param {Array|Object} collection
 * @returns {Array}
 */
export const dbCollectionToArray = (collection) => {
  if (Array.isArray(collection)) {
    return collection;
  }

  if (_isPlainObject(collection)) {
    return Object.values(collection);
  }

  return [];
};

export const getBlockUrlProp = (block) => {
  const filesProps = {
    [BlockTypes.Image]: "image_path",
    [BlockTypes.PDF]: "pdf_path",
  };
  const filesProp = filesProps[block.type];

  return filesProp;
};

export const getBlockFilesProp = (block) => {
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

export const getBlockFilesDefault = (block, raw) => {
  const filesProp = getBlockFilesProp(block);
  const blockDefaults = getBlockDefaults();

  const defaultValue = blockDefaults[filesProp];

  if (raw) {
    return defaultValue;
  }

  return dbCollectionToArray(defaultValue);
};

export const getBlockFiles = (block, raw) => {
  const filesProp = getBlockFilesProp(block);

  const value = block[filesProp];

  if (value) {
    if (raw) {
      return value;
    }

    return dbCollectionToArray(value);
  }

  return getBlockFilesDefault(block, raw);
};

export const blockFilesArrayToRaw = (block, files) => {
  const rawDefaultValue = getBlockFilesDefault(block, true);

  if (!files || !files.length) {
    return rawDefaultValue;
  }

  if (Array.isArray(rawDefaultValue)) {
    return files;
  }

  return _keyBy(files, "id");
};

const encodeFilePath = (path) => {
  return encodeURIComponent(path).replace(/\./g, "%2E");
};

export const getFileUsage = async (file) => {
  const fileId = encodeFilePath(file.storagePath);
  const snap = await firebase
    .database()
    .ref(`files/${file.createdBy}/${fileId}/usage`)
    .once("value");

  let usage;

  if (snap.exists()) {
    usage = snap.val();
  }

  return usage;
};

export const getBoardSortByKey = (sort) => {
  const sortTypes = {
    "A-TO-Z": "board_name",
    "Z-TO-A": "board_name",
    "BOARD-OLDEST-FIRST": "date_created",
    "BOARD-NEWEST-FIRST": "date_created",
    COLORS: "board_header_color",
  };
  const sortBy = sortTypes[sort];

  return sortBy;
};

/**
 * Creates filter function that filters files that were (not) uploaded by the given user
 *
 * This function creates a callback function for array.filter() that selects only
 * the files that were (not) uploaded by the given user.
 *
 * @param {Object} user
 * @param {Boolean} invert
 */
export const createUserFilesFilter = (user, invert = false) => {
  return (file) => {
    const isUploadedByUser = file.createdBy === user.wbid;

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
export const createUploadedFilesFilter = (invert = false) => {
  return (file) => {
    const isUploadedFile = !!file.storagePath;

    if (invert) {
      return !isUploadedFile;
    }

    return isUploadedFile;
  };
};

export const extractFiles = (value) => {
  const matcher = (file) => {
    return (
      isExtractableFile(file) ||
      (file && file.data && isExtractableFile(file.data)) ||
      (file && file.isRemote)
    );
  };

  return baseExtractFiles(value, "", matcher);
};

export const isDesktopWidth = () => {
  return window.innerWidth > minDeviceWidth;
};

export const getCorsProxyForUrl = (url) => {
  const corsProxy = new URL(`${getFirebaseFunctionsUrl()}/cors_proxy`);
  corsProxy.searchParams.set("url", String(url));

  return corsProxy.toString();
};

export const withHttp = (() => {
  const linkify = new LinkifyIt();
  linkify.tlds(tlds);

  return (url) => {
    const match = linkify.match(url);

    if (match) {
      return match[0].url;
    }

    return url;
  };
})();

export const getFilePromise = (path) => {
  return axios({
    url: path,
    method: "GET",
    responseType: "blob",
  })
    .then((result) => {
      return result.data;
    })
    .catch((error) => {
      return JSON.stringify(error);
    });
};

/**
 * Modify a file name without affecting the "file extension" portion
 *
 * The `modifier` parameter is a function that will be invoked with
 * a single argument:
 *
 * - name: The file name without the "file extension" portion
 *
 * It should return the modified file name.
 *
 * @param {String} fileName
 * @param {Function} modifier
 * @returns {String}
 */
export const modifyFileName = (fileName, modifier) => {
  let name = "";
  let extension = "";
  const dotIndex = fileName.indexOf(".");

  if (dotIndex !== -1) {
    name = fileName.substr(0, dotIndex);
    extension = fileName.substr(dotIndex);
  } else {
    name = fileName;
  }

  name = modifier(name);

  const newFileName = `${name}${extension}`;

  return newFileName;
};

/**
 * A modifier function factory for `modifyFileName` that helps
 * ensure unique file names
 *
 * The functions created by this factory keep track of every
 * file name they see and append ` (x)` to those that they see
 * repeatedly, where `x` is an incrementing integer that starts
 * at 1.
 *
 * @returns {Function}
 */
modifyFileName.createIncrementor = () => {
  const names = {};

  return (name) => {
    let newName = name;

    if (!Object.prototype.hasOwnProperty.call(names, name)) {
      names[name] = 0;
    } else {
      newName = `${name} (${(names[name] += 1)})`;
    }

    return newName;
  };
};

/**
 * A modifier function that appends a UUID to the given
 * file name
 *
 * The modified file name will look like this:
 *
 * `${name}_${uuid}`
 *
 * @param {String} name
 * @returns {String}
 */
modifyFileName.appendUUID = (name) => {
  const uuid = createUUID();
  const newName = `${name}_${uuid}`;

  return newName;
};

export const downloadBoard = async (board_id, board_name) => {
  const blockRef = firebase.database().ref(`blocks/${board_id}`);
  const zip = new JSZip();

  await blockRef.once("value", (snapshot) => {
    const blockDataFileNameModifier = modifyFileName.createIncrementor();

    snapshot.forEach((block) => {
      const blockData = block.val();
      let blockDataFileName = blockData.title.replace(/\//g, "_");
      blockDataFileName = modifyFileName(
        blockDataFileName,
        blockDataFileNameModifier
      );

      zip.file(`${blockDataFileName}.json`, JSON.stringify(blockData));

      if (blockData.type === BlockTypes.PDF) {
        const pdfPromise = getFilePromise(blockData.pdf_path);
        zip.file(`${blockDataFileName}.pdf`, pdfPromise);
      } else if (blockData.type === BlockTypes.Image) {
        const imagePromise = getFilePromise(blockData.image_path);
        zip.file(`${blockDataFileName}.png`, imagePromise);
      } else if (blockData.type === BlockTypes.Files) {
        const filesFolder = zip.folder(blockDataFileName);
        const fileNameModifier = modifyFileName.createIncrementor();

        blockData.files.forEach((file) => {
          const filePromise = getFilePromise(file.filePath);
          const fileName = modifyFileName(file.fileName, fileNameModifier);

          filesFolder.file(fileName, filePromise);
        });
      }
    });
  });

  const readme = `This zipfile contains the contents of the Whatboard "${board_name}". Note that while file attachments are downloaded as the original file, text blocks are downloaded in .json format. Coming soon... the ability to upload a zipped whatboard file and restore your board & the ability to send your whatboard zipped files to other users.`;
  zip.file(`README.txt`, readme);
  /* eslint func-names: ["error", "never"] */
  zip.generateAsync({ type: "blob" }).then(function (content) {
    saveAs(content, `Whatboard-${board_name}.zip`);
  });
};

export const downloadAllFiles = async (files, blockTitle, boardName) => {
  const zip = new JSZip();
  const fileNameModifier = modifyFileName.createIncrementor();

  files.forEach((file) => {
    const filePromise = getFilePromise(file.filePath);
    const fileName = modifyFileName(file.fileName, fileNameModifier);

    zip.file(fileName, filePromise);
  });

  /* eslint func-names: ["error", "never"] */
  await zip.generateAsync({ type: "blob" }).then(function (content) {
    saveAs(content, `${boardName} -- ${blockTitle}.zip`);
  });
};

export const totalUsage = (usage) => {
  let total = 0;

  objectComb(
    usage,
    (value) => {
      total += value;

      return value;
    },
    _isNumber
  );

  return total;
};

/**
 * Determine whether or not a file can be deleted
 *
 * A file can be deleted when its total usage count
 * is <= 1.
 *
 * Automatic file deleting is scheduled once the file
 * has no remaining usage records, so why <= 1, you ask?
 *
 * This function is typically called when removing a
 * file from somewhere. That removal will also trigger
 * the removal of any relevant usage records. Since
 * we're about to do a removal, if we have one usage
 * remaining, it can be assumed that said usage record
 * is owned by the entity the file is being removed from.
 * Once the removal happends, the file will have no more
 * usage records, and be eligible for automatic deletion.
 *
 * @param {Object} file
 *
 * @returns {Boolean}
 */
export const isFileDeletable = async (file) => {
  const usage = await getFileUsage(file);
  let isDeletable = false;

  if (!_isPlainObject(usage)) {
    isDeletable = true;
  } else {
    isDeletable = totalUsage(usage) <= 1;
  }

  return isDeletable;
};

/**
 * Create a case-insensitive Lodash iteratee
 *
 * This takes an existing Lodash iteratee (like you would
 * pass to `_.orderBy()`, for example) and ensures that
 * the value it returns can be used for case-insensitive
 * comparisons.
 *
 * @param {Array|Function|Object|string} iteratee
 *   See https://lodash.com/docs/4.17.15#iteratee
 * @returns {Function}
 */
export const makeCaseInsensitiveIteratee = (iteratee) => {
  const realIteratee = _iteratee(iteratee);

  return (value) => {
    let realValue = realIteratee(value);

    if (_isString(realValue)) {
      realValue = realValue.toLocaleLowerCase("en-US");
    }

    return realValue;
  };
};

/**
 * Create a Date/Time Lodash iteratee
 *
 * This takes an existing Lodash iteratee (like you would
 * pass to `_.orderBy()`, for example) and ensures that
 * the value it returns can be used for date/time-based
 * comparisons.
 *
 * @param {Array|Function|Object|string} iteratee
 *   See https://lodash.com/docs/4.17.15#iteratee
 * @returns {Function}
 */
export const makeDateTimeIteratee = (iteratee) => {
  const realIteratee = _iteratee(iteratee);

  return (value) => {
    const realValue = realIteratee(value);

    if (realValue instanceof Date) {
      return realValue;
    }

    if (Dayjs.isDayjs(realValue)) {
      return realValue.toDate();
    }

    return new Date(realValue);
  };
};

export const makeBoardColorsIteratee = (iteratee) => {
  const realIteratee = _iteratee(iteratee);
  const defaulIndex = boardColors.indexOf(ThemeColors.NOCOLOR);

  return (value) => {
    const realValue = realIteratee(value);

    const index = boardColors.indexOf(realValue);

    if (index === -1) {
      return defaulIndex;
    }

    return index;
  };
};

export const timeSort = (_blocks) => {
  const blocks = _blocks;
  let iteratee = (block) => {
    if (!("date_created" in block)) {
      return new Date(-8640000000000000); // oldest date possible
    }

    return block.date_created;
  };
  iteratee = makeDateTimeIteratee(iteratee);

  return _orderBy(blocks, [iteratee], ["desc"]);
};

export const isExternalUrl = (url) => {
  const { origin } = window.location;

  if (!_isString(url) && !(url instanceof URL)) {
    return false;
  }

  if (_isString(url) && isObjectUrl(url)) {
    return true;
  }

  const urlObj = new URL(url, origin);

  return urlObj.origin !== origin;
};

export const httpToHttps = async (url) => {
  const urlObj = new URL(url);

  if (urlObj.protocol !== "http:") {
    return url;
  }

  try {
    const urlStr = urlObj.toString();
    const func = getCallableFbFunction("blocks-httpToHttps");

    const result = await func({ url: urlStr });

    return result.data;
  } catch (e) {
    return url;
  }
};

export const keyDownA11y = (handler) => (event) => {
  if (
    ["keydown", "keypress"].includes(event.type) &&
    ["Enter", " "].includes(event.key)
  ) {
    handler();
  }
};

/**
 * Helper function to manage cleanup of Firebase Realtime Database event handlers
 *
 * Calls `refOrQuery.on()` with all of the other arguments.
 *
 * Returns a function that will call `refOrQuery.off()` appropriately. This function
 * can then be called when it is time to unbind `callback`.
 *
 * @link https://firebase.google.com/docs/reference/js/v8/firebase.database.Query?authuser=0#on
 *
 * @param {firebase.database.Query} refOrQuery
 * @param {firebase.database.EventType} eventType
 * @param {Function} callback
 * @param {Function|Object|null} cancelCallbackOrContext
 * @param {Object|null} context
 * @returns {Function}
 */
export const onDatabaseEvent = (
  refOrQuery,
  eventType,
  callback,
  cancelCallbackOrContext,
  context
) => {
  refOrQuery.on(eventType, callback, cancelCallbackOrContext, context);

  const unsbubscribe = () => {
    refOrQuery.off(eventType, callback, context);
  };

  return unsbubscribe;
};

export const dataUrlToFileUsingFetch = async (url, fileName, mimeType) => {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();

  return new File([buffer], fileName, { type: mimeType });
};

export const getBrandImageUrl = (userId) => {
  const storage = getStorage();
  const storageUri = `users/${userId}/brand_image.png`;
  return getDownloadURL(storageRef(storage, storageUri))
    .then((url) => {
      return url;
    })
    .catch(() => null);
};
