import Uppy from "@uppy/core";
import isObjectUrl from "@uppy/utils/lib/isObjectURL";
import access from "./access";
import { BlockTypes } from "./constant";

export const allowedImageTypes = [
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const allowedPdfTypes = ["application/pdf"];

export const allowedSpreadsheetTypes = [
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  // maybe more types later
];

/**
 * Create an Uppy instance ID for the given Block
 *
 * This function creates a value suitable for the
 * `id` option of the main Uppy config.
 *
 * @see https://uppy.io/docs/uppy/#id-39-uppy-39
 *
 * @param {Object} block
 *   The Block to generate an Uppy ID for.
 * @param {string} suffix
 *   An optional suffix for the ID; Useful if file picking and uploading
 *   are split across different components.
 * @returns {string}
 */
export const makeUppyIdForBlock = (block, suffix) => {
  let uppyId = `uppy-${block.board_id}-${block.id}`;

  if (suffix) {
    uppyId = `${uppyId}-${suffix}`;
  }

  return uppyId;
};

/**
 * Create an Uppy instance ID for the given Board
 *
 * This function creates a value suitable for the
 * `id` option of the main Uppy config.
 *
 * @see https://uppy.io/docs/uppy/#id-39-uppy-39
 *
 * @param {strinf} board_id
 *   The ID of the Board to generate an Uppy ID for.
 * @param {string} suffix
 *   An optional suffix for the ID; Useful if file picking and uploading
 *   are split across different components.
 * @returns {string}
 */
export const makeUppyIdForBoard = (board_id, suffix) => {
  let uppyId = `uppy-${board_id}`;

  if (suffix) {
    uppyId = `${uppyId}-${suffix}`;
  }

  return uppyId;
};

/**
 * Retrieve Uppy options common to all Uppy instances
 *
 * @returns {Object}
 */
export const getCommonOptions = () => {
  return {
    allowMultipleUploads: false,
    allowMultipleUploadBatches: false,
    logger: Uppy.debugLogger,
    infoTimeout: 5000,
  };
};

/**
 * Create Uppy restrictions for the given User
 *
 * @param {Object} user
 *   The User to create restrictions for
 * @param {Object} options
 *   Configuration options
 * @param {number} [options.storageAdjustment=0]
 *   An optional number to adjust the maximum total file size by
 */
export const makeRestrictionsForUser = (user, options = {}) => {
  const { storageAdjustment = 0 } = options;

  let maxTotalFileSize = null;
  const maxStorageSize = access.getMaxStorageSize(user);

  if (maxStorageSize > -1) {
    maxTotalFileSize = Math.max(
      0,
      maxStorageSize - user.usage.storage - storageAdjustment
    );
  }

  const restrictions = {
    maxTotalFileSize,
  };

  return restrictions;
};

/**
 * Create Uppy restrictions for the given Block and User
 *
 * @param {Object} block
 *   The Block to create restrictions for
 * @param {Object} user
 *   The User to create restrictions for
 * @param {Object} options
 *   Configuration options
 * @param {number} [options.storageAdjustment=0]
 *   An optional number to adjust the maximum total file size by
 */
export const makeRestrictionsForBlock = (block, user, options = {}) => {
  const userRestrictions = makeRestrictionsForUser(user, options);
  let allowedFileTypes = null;
  let maxNumberOfFiles = 1;

  switch (block.type) {
    case BlockTypes.PDF:
      allowedFileTypes = allowedPdfTypes;
      break;
    case BlockTypes.Image:
      allowedFileTypes = allowedImageTypes;
      break;
    case BlockTypes.Files:
    case BlockTypes.FileRequest:
      maxNumberOfFiles = null;
      break;
    case BlockTypes.Grid:
      allowedFileTypes = allowedSpreadsheetTypes;
      break;
    default:
      break;
  }

  const restrictions = {
    ...userRestrictions,
    maxNumberOfFiles,
    minNumberOfFiles: 1,
    allowedFileTypes,
  };

  return restrictions;
};

/**
 * Create an upload storage folder path for the given Block
 *
 * @param {Object} block
 */
export const makeUploadFolderForBlock = (block) => {
  return `/whiteboards/${block.board_id}/${block.id}`;
};

/**
 * Convert an Uppy file into a Whatboard File Object
 *
 * @param {import("@uppy/core").UppyFile} uppyFile
 * @param {Object} user
 * @returns {Object}
 */
export const uppyFileToWhatboardFile = (uppyFile, user) => {
  let fileObj = {
    createdBy: uppyFile.meta.uploaderWbid || user.wbid,
    fileName: uppyFile.meta.name,
    fileSize: uppyFile.size,
    fileType: uppyFile.type,
    uploadDate: new Date().toJSON(),
  };

  if (uppyFile.uploadURL && uppyFile.response) {
    fileObj = {
      ...fileObj,
      filePath: uppyFile.uploadURL,
      storagePath: uppyFile.response.uploadTask.snapshot.metadata.fullPath,
    };

    if (uppyFile.meta.fileId) {
      fileObj.id = uppyFile.meta.fileId;
    }
  } else {
    fileObj = {
      ...uppyFile,
      ...fileObj,
      filePath: URL.createObjectURL(uppyFile.data),
      storagePath: "/this/is/a/dummy/path",
    };
  }

  // Clear out Uppy thumbnail previews created by
  // `URL.createObjectURL` (which, ATM, is all of them).
  // Those are managed by Uppy itself, and will possibly
  // get revoked before we're actually done using the
  // file object.
  //
  // An example of this situation would be when passing
  // files from one of the file selector UIs into the
  // `Block` component for uploading. The Uppy instance
  // powering the file selector will have revoked
  // the object URL for the thumbnail preview by this
  // point, leading to errors when the Uppy instance
  // powering the `Block` component's uploader tries
  // to use it.
  if (fileObj.preview && isObjectUrl(fileObj.preview)) {
    delete fileObj.preview;
  }

  return fileObj;
};
