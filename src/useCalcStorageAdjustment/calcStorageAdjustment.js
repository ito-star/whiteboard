import _difference from "lodash/difference";
import {
  getBlockFiles,
  getFileUsage,
  createUserFilesFilter,
  createUploadedFilesFilter,
  isFileDeletable,
} from "../utils";

export const shouldUpdateStorageAdjustment = (block, prevBlock) => {
  let updateStorageAdjustment;

  if (!prevBlock) {
    updateStorageAdjustment = false;
  } else if (block.type !== prevBlock.type) {
    updateStorageAdjustment = true;
  } else {
    updateStorageAdjustment = getBlockFiles(block) !== getBlockFiles(prevBlock);
  }

  return updateStorageAdjustment;
};

export const calcStorageAdjustment = async (block, prevBlock, user) => {
  let storageAdjustment = 0;

  if (prevBlock && user) {
    if (block.type !== prevBlock.type) {
      storageAdjustment = 0;
    } else {
      const userFilesFilter = createUserFilesFilter(user);
      const uploadedFilesFilter = createUploadedFilesFilter();

      const blockFiles = getBlockFiles(block)
        .filter(userFilesFilter)
        .filter(uploadedFilesFilter);

      const prevBlockFiles = getBlockFiles(prevBlock)
        .filter(userFilesFilter)
        .filter(uploadedFilesFilter);

      const delFiles = _difference(prevBlockFiles, blockFiles);
      await Promise.all(
        delFiles.map(async (file) => {
          const doCalc = await isFileDeletable(file);

          if (doCalc) {
            storageAdjustment -= file.fileSize;
          }
        })
      );

      const newFiles = _difference(blockFiles, prevBlockFiles);
      await Promise.all(
        newFiles.map(async (file) => {
          const usage = await getFileUsage(file);
          const doCalc = !usage || Object.keys(usage) === 0;

          if (doCalc) {
            storageAdjustment += file.fileSize;
          }
        })
      );
    }
  }

  return storageAdjustment;
};
