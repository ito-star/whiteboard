const path = require("path");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const pMap = require("p-map");
const _ = require("lodash");

const {
  createUploadedFilesFilter,
  createUserFilesFilter,
  getBlockFiles,
  getBlockFilesProp,
  getBlockUrlProp,
} = require("./utils");
const { access } = require("./access");

/**
 * Clone a board and give it to the specified user
 *
 * The board will only be cloned if the user has enough board usage remaining.
 * If the user does not have enough board usage remaining, an error will be thrown.
 *
 * @param {Object} user - The owner of the cloned board
 * @param {string} boardId - The ID of the source board
 * @param {Object} board - The source board
 * @param {Object} [options]
 * @param {boolean} [options.reassignFileOwnership=true] - Whether or not to reaassign ownership of all files to `user`.
 * You usually want to do this. However, there are situations where it is better to leave file ownership untouched
 * (i.e. when cloning the README board for a new user).
 * @param {boolean} [options.cloneFiles=false] - Whether or not to clone the files that do not belong to `user`. This option
 * only takes effect if `options.reassignFileOwnership` is `true`. File cloning wlll only happen if `user` has
 * enough storage space remaining. If `user` does not have enough storage space remaining, an error will be thrown.
 * If this options is `false`, then all files that do not belong to `user` will be converted into "external" files.
 * @param {boolean} [options.namePrefix=Cloned ] - An optional prefix attached to the cloned board's name
 */
module.exports = async (user, boardId, board, options = {}) => {
  const {
    reassignFileOwnership = true,
    cloneFiles = false,
    namePrefix = "Cloned ",
    name = "",
  } = options;

  const canCreateBoards = await access.canCreateBoards(user);

  if (!canCreateBoards) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "You have reached the maximum number of allowed boards for your account"
    );
  }

  const blocksSnap = await admin
    .database()
    .ref(`blocks/${boardId}`)
    .once("value");

  const userFilesFilter = createUserFilesFilter(user.wbid, true);
  const uploadedFilesFilter = createUploadedFilesFilter();

  if (cloneFiles) {
    const filesToClone = [];

    blocksSnap.forEach((blockSnap) => {
      let blockFiles = getBlockFiles(blockSnap.val());
      blockFiles = _.filter(blockFiles, userFilesFilter);
      blockFiles = _.filter(blockFiles, uploadedFilesFilter);
      filesToClone.push(...blockFiles);
    });

    const totalFileSize = filesToClone.reduce((total, file) => {
      return total + file.fileSize;
    }, 0);

    const hasEnoughStorageSpace = await access.hasEnoughStorageSpace(
      totalFileSize,
      user
    );

    if (!hasEnoughStorageSpace) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "You do not have enough storage space to duplicate the files in this Whatboard"
      );
    }
  }

  const updates = {};
  const promises = [];

  const { boardBodyColor, board_header_color } = board;

  const userWhiteboardsPath = `users/${user.wbid}/whiteboards`;
  const ref = admin.database().ref(userWhiteboardsPath);
  const newName = name !== "" ? name : `${namePrefix}${board.board_name}`;
  const limits = await access.getMaxBoardLoads(user);

  let clonedBoard = {
    board_name: newName,
    boardBodyColor,
    board_header_color,
    board_members: [user.wbid],
    date_created: new Date().toJSON(),
    loadLimit: limits,
  };

  clonedBoard = _.omitBy(clonedBoard, _.isUndefined);

  const boardPushRef = ref.push();

  updates[`${userWhiteboardsPath}/${boardPushRef.key}`] = clonedBoard;
  updates[`whiteboards/${boardPushRef.key}`] = clonedBoard;

  const newBlocksPath = `blocks/${boardPushRef.key}`;

  blocksSnap.forEach((block) => {
    const runner = async () => {
      const blockPushRef = admin.database().ref(newBlocksPath).push();
      const newBlock = {
        ...block.val(),
        id: blockPushRef.key,
        board_id: boardPushRef.key,
        created_by: user.wbid,
      };

      const files = getBlockFiles(newBlock);
      const filesProp = getBlockFilesProp(newBlock);
      const urlProp = getBlockUrlProp(newBlock);

      if (filesProp) {
        newBlock[filesProp] = (
          await pMap(_(files), async (file) => {
            const newFile = {
              ...file,
              createdBy: reassignFileOwnership
                ? newBlock.created_by
                : file.createdBy,
            };

            if (
              reassignFileOwnership &&
              userFilesFilter(file) &&
              uploadedFilesFilter(file)
            ) {
              if (!cloneFiles) {
                // Turn all files not owned by the current user
                // into "external" files

                if (urlProp) {
                  // Block types with a URL prop (i.e. Image, PDF)
                  // only support a single file. Here, the files prop is used
                  // to differentiate between files upload to Whatboard file
                  // storage and "external" files.
                  return null;
                }

                delete newFile.storagePath;
              } else {
                const newStoragePath = `whiteboards/${newBlock.board_id}/${
                  newBlock.id
                }/${path.basename(file.storagePath)}`;

                const storageRef = admin
                  .storage()
                  .bucket()
                  .file(file.storagePath);
                const [exists] = await storageRef.exists();

                if (exists) {
                  newFile.filePath = file.filePath
                    .replace(
                      encodeURIComponent(block.board_id),
                      encodeURIComponent(newBlock.board_id)
                    )
                    .replace(
                      encodeURIComponent(block.id),
                      encodeURIComponent(newBlock.id)
                    );
                  newFile.storagePath = newStoragePath;

                  if (urlProp) {
                    newBlock[urlProp] = newFile.filePath;
                  }

                  promises.push(storageRef.copy(newStoragePath));
                }
              }
            }

            return newFile;
          })
        ).filter(Boolean);

        if (_.isPlainObject(files)) {
          newBlock[filesProp] = _.keyBy(newBlock[filesProp], "id");
        }
      }

      updates[`${newBlocksPath}/${blockPushRef.key}`] = newBlock;
    };

    promises.push(runner());
  });

  await Promise.all(promises);
  await admin.database().ref().update(updates);

  return {
    newBoardId: boardPushRef.key,
  };
};
