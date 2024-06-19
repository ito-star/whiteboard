const admin = require("firebase-admin");

require("../fb-admin-init");

const db = admin.database();

module.exports = (program) => {
  program
    .command("init-board-usage")
    .description("Initialize Board usage tracking")
    .action(async () => {
      console.log("Setting Board usage information");
      const usersRef = db.ref("users");
      const usersSnap = await usersRef.once("value");
      const usagePromises = [];

      usersSnap.forEach((userSnap) => {
        const userBoards = userSnap.child("whiteboards");
        let boardUsage = 0;

        userBoards.forEach((userBoardSnap) => {
          const boardMembers = userBoardSnap.child("board_members").val();

          if (boardMembers[0] === userSnap.key) {
            boardUsage += 1;
          }
        });

        console.log("%s: %d Boards created", userSnap.key, boardUsage);

        const usagePromise = db
          .ref(`metadata/${userSnap.key}/usage/boards`)
          .set(boardUsage);
        usagePromises.push(usagePromise);
      });

      await Promise.all(usagePromises);
    });
};
