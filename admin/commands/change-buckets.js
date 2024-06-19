const admin = require("firebase-admin");

module.exports = (program) => {
  program
    .command("change-buckets")
    .description("Change the Google Cloud Storage bucket used by Whatboard")
    .on("--help", () => {
      console.log("");
      console.log(
        "This command does not move any files. It only updates the database to replace <old_bucket> with <new_bucket>. You must move all of the files before running this command."
      );
    })
    .arguments("<old_bucket> <new_bucket>")
    .option(
      "-n, --dry-run",
      "Do not actually do anything, only display what would be done"
    )
    .action(async (oldBucketName, newBucketName, cmdObj) => {
      if (cmdObj.dryRun) {
        console.log("--- DRY RUN ---");
      }

      console.log(
        `Replacing bucket "${oldBucketName}" with "${newBucketName}"`
      );

      const newBucketRef = admin.storage().bucket(newBucketName);
      const [newBucketExists] = await newBucketRef.exists();

      if (!newBucketExists) {
        throw new Error(`Cannot find bucket named ${newBucketName}`);
      }

      const blocksRef = admin.database().ref("blocks");
      const blocksSnap = await blocksRef.once("value");

      const replacer = (url) => {
        return url.replace(
          encodeURIComponent(oldBucketName),
          encodeURIComponent(newBucketName)
        );
      };

      const promises = [];

      blocksSnap.forEach((snap) => {
        snap.forEach((blockSnap) => {
          const block = blockSnap.val();
          const update = {};

          if (block.image_path && block.image_path.includes(oldBucketName)) {
            update.image_path = replacer(block.image_path);
          }

          if (block.pdf_path && block.pdf_path.includes(oldBucketName)) {
            update.pdf_path = replacer(block.pdf_path);
          }

          const fileFields = ["files", "imageFiles", "pdfFiles"];
          fileFields.forEach((field) => {
            const files = block[field];

            if (Array.isArray(files)) {
              update[field] = files.map((file) => {
                const newFile = file;
                newFile.filePath = replacer(file.filePath);

                return newFile;
              });
            }
          });

          if (Object.keys(update).length) {
            console.log(update);
          }

          promises.push(blockSnap.ref.update(update));
        });
      });

      await Promise.all(promises);
    });
};
