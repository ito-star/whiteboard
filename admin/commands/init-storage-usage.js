const path = require("path");
const util = require("util");
const admin = require("firebase-admin");
const pMap = require("p-map");
const _ = require("lodash");
const { idToEmail, fileFromUrl, encodeFilePath } = require("../utils");

const singleFileFields = ["pdf_path", "image_path"];
const multiFileFields = ["files"];
const fileFields = [...singleFileFields, ...multiFileFields];

const typeMap = {
  pdf_path: "PDF",
  image_path: "Image",
  files: "Files",
};

const initStorageUsage = async () => {
  const updates = {
    "file-usage-init": true,
  };

  await admin.database().ref().update(updates);
};

module.exports = (program) => {
  program
    .command("init-storage-usage")
    .description("Initialize storage usage tracking")
    .action(async () => {
      console.log("Setting storage usage information");

      await initStorageUsage();

      const blocksRef = admin.database().ref("blocks");
      const blocksSnap = await blocksRef.once("value");

      const promises = [];
      const toSetMetadata = new Set();

      const updates = {
        "file-usage-init": null,
      };

      const fileUpdates = {};

      const blockUpdates = {};

      const metadataUpdates = {};

      const addFileUsage = (block, file) => {
        const dbPath = `/files/${file.createdBy}/${encodeFilePath(
          file.storagePath
        )}`;

        if (!fileUpdates[dbPath]) {
          fileUpdates[dbPath] = {
            ...file,
          };
        }

        const usagePath = `usage.boards.${block.board_id}.${block.id}`;
        _.update(fileUpdates[dbPath], usagePath, (count) => {
          return (count || 0) + 1;
        });
      };

      blocksSnap.forEach((snap) => {
        snap.forEach((blockSnap) => {
          const runner = async () => {
            try {
              const block = blockSnap.val();
              const email = idToEmail(block.created_by);
              const user = await admin.auth().getUserByEmail(email);

              await Promise.all(
                fileFields.map(async (field) => {
                  const value = block[field];

                  if (value) {
                    if (block.type !== typeMap[field]) {
                      blockUpdates[
                        `/blocks/${block.board_id}/${block.id}/${field}`
                      ] = singleFileFields.includes(field) ? "" : [];
                      return;
                    }

                    let fileUrls = [];

                    if (singleFileFields.includes(field)) {
                      fileUrls = [value];
                    } else if (multiFileFields.includes(field)) {
                      fileUrls = value.map((file) => file.filePath);
                    }

                    await pMap(fileUrls, async (fileUrl) => {
                      const fileRef = fileFromUrl(fileUrl);

                      if (!fileRef) {
                        return;
                      }

                      const [exists] = await fileRef.exists();

                      if (exists) {
                        const [metadata] = await fileRef.getMetadata();
                        const usagePath = `/metadata/${block.created_by}/usage/storage`;

                        if (!metadataUpdates[usagePath]) {
                          metadataUpdates[usagePath] = 0;
                        }

                        metadataUpdates[usagePath] += Number(metadata.size);

                        if (singleFileFields.includes(field)) {
                          let newFilesField;

                          switch (field) {
                            case "pdf_path":
                              newFilesField = "pdfFiles";
                              break;
                            case "image_path":
                              newFilesField = "imageFiles";
                              break;
                            default:
                              break;
                          }

                          if (newFilesField) {
                            const fileObj = {
                              createdBy: block.created_by,
                              fileName: path.basename(metadata.name),
                              filePath: fileUrl,
                              fileSize: Number(metadata.size),
                              fileType: metadata.contentType,
                              storagePath: metadata.name,
                              uploadDate: metadata.timeCreated,
                            };

                            blockUpdates[
                              `/blocks/${block.board_id}/${block.id}/${newFilesField}`
                            ] = [fileObj];
                            addFileUsage(block, fileObj);
                          }
                        } else if (multiFileFields.includes(field)) {
                          const index = value.findIndex((file) => {
                            return file.filePath === fileUrl;
                          });

                          blockUpdates[
                            `/blocks/${block.board_id}/${block.id}/${field}/${index}/createdBy`
                          ] = block.created_by;
                          blockUpdates[
                            `/blocks/${block.board_id}/${block.id}/${field}/${index}/storagePath`
                          ] = metadata.name;

                          addFileUsage(block, {
                            ...value[index],
                            createdBy: block.created_by,
                            storagePath: metadata.name,
                          });
                        }

                        if (!toSetMetadata.has(fileUrl)) {
                          toSetMetadata.add(fileUrl);
                          promises.push(
                            fileRef.setMetadata({
                              metadata: {
                                uploaderUid: user.uid,
                                uploaderWbid: block.created_by,
                              },
                            })
                          );
                        }
                      }
                    });
                  }
                })
              );
            } catch (e) {
              if (
                e.code === "auth/user-not-found" ||
                e.code === "auth/invalid-email"
              ) {
                // Do nothing
              } else {
                throw e;
              }
            }
          };

          promises.push(runner());
        });
      });

      await Promise.all(promises);

      console.log("--- File Updates ---");
      console.log(
        util.inspect(fileUpdates, {
          colors: true,
          depth: 10,
          compact: false,
        })
      );
      await admin.database().ref().update(fileUpdates);

      console.log("--- Block Updates ---");
      console.log(
        util.inspect(blockUpdates, {
          colors: true,
          depth: 10,
          compact: false,
        })
      );
      await admin.database().ref().update(blockUpdates);

      console.log("--- Metadata Updates ---");
      console.log(
        util.inspect(metadataUpdates, {
          colors: true,
          depth: 10,
          compact: false,
        })
      );
      await admin.database().ref().update(metadataUpdates);

      console.log("--- General Updates ---");
      console.log(
        util.inspect(updates, {
          colors: true,
          depth: 10,
          compact: false,
        })
      );
      await admin.database().ref().update(updates);
    });
};
