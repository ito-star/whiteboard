const admin = require("firebase-admin");
const pMap = require("p-map");
const pAll = require("p-all");
const { getBlockFiles, fileFromUrl } = require("../utils");

module.exports = (program) => {
  program
    .command("fix-file-downloads")
    .description("Fix File Downloads")
    .action(async () => {
      console.log(
        'Fixing downloading of files in File and File Request Blocks, as well as files that have been "popped out" of them'
      );

      const blocksRef = admin.database().ref("blocks");
      const blocksSnap = await blocksRef.once("value");

      const promises = [];
      const toSetMetadata = new Set();

      blocksSnap.forEach((snap) => {
        snap.forEach((blockSnap) => {
          const runner = async () => {
            const block = blockSnap.val();

            const blockFiles = getBlockFiles(block);

            if (!blockFiles.length) {
              return;
            }

            await pMap(
              blockFiles,
              async (file) => {
                const fileUrl = file.filePath;
                const fileRef = fileFromUrl(fileUrl);

                if (!fileRef) {
                  return;
                }

                const [exists] = await fileRef.exists();

                if (!exists) {
                  return;
                }

                const [metadata] = await fileRef.getMetadata();

                if (
                  metadata.contentDisposition &&
                  !toSetMetadata.has(fileUrl)
                ) {
                  console.log(fileRef.name);
                  toSetMetadata.add(fileUrl);
                  promises.push(() =>
                    fileRef.setMetadata({
                      contentDisposition: "",
                    })
                  );
                }
              },
              { concurrency: 5 }
            );
          };

          promises.push(runner);
        });
      });

      await pAll(promises, { concurrency: 5 });
    });
};
