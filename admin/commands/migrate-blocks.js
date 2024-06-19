const admin = require("firebase-admin");

require("../fb-admin-init");

const db = admin.database();

module.exports = (program) => {
  program
    .command("migrate-blocks")
    .description("Migrate blocks to new format")
    .action(async () => {
      const boardsRef = db.ref("whiteboards");
      const boardsSnap = await boardsRef.once("value");
      let blockPromises = [];
      const boardSnaps = [];

      boardsSnap.forEach((board) => {
        boardSnaps.push(board);

        if (board.hasChild("layout")) {
          const blocksRef = db.ref(`blocks/${board.key}`);
          const layoutSnap = board.child("layout");

          const promises = layoutSnap
            .val()
            .filter((block) => block.show)
            .map(async (block) => {
              const blockRef = blocksRef.push();
              const newBlock = {
                ...block,
                id: blockRef.key,
                board_id: board.key,
              };

              delete newBlock.show;
              delete newBlock.i;
              delete newBlock.index;

              blockRef.update(newBlock);

              return blockRef;
            });

          blockPromises = blockPromises.concat(promises);
        }
      });

      await Promise.all(blockPromises);

      const boardPromises = boardSnaps.map(async (board) => {
        const layoutSnap = board.child("layout");

        if (layoutSnap.exists()) {
          await layoutSnap.ref.remove();
        }

        const counterSnap = board.child("counter");

        if (counterSnap.exists()) {
          await counterSnap.ref.remove();
        }
      });

      await Promise.all(boardPromises);
      console.log("Migration complete");
    });
};
