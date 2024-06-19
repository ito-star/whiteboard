const admin = require("firebase-admin");

require("../fb-admin-init");

const db = admin.database();

module.exports = (program) => {
  program
    .command("update-user-boards")
    .description("Update per-user board info")
    .action(async () => {
      const boardsRef = db.ref("whiteboards");
      const boardsSnap = await boardsRef.once("value");
      const promises = [];

      boardsSnap.forEach((boardSnap) => {
        const board = boardSnap.val();
        if (board.board_members) {
          const updates = {};

          for (const x of board.board_members) {
            for (const [key, value] of Object.entries(board)) {
              updates[`users/${x}/whiteboards/${boardSnap.key}/${key}`] = value;
            }
          }

          const promise = db.ref().update(updates);
          promises.push(promise);
        }
      });

      await Promise.all(promises);

      console.log("Update complete");
    });
};
