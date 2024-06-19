const admin = require("firebase-admin");
const pAll = require("p-all");
const { idToEmail, getRoleLoadLimits, getUser, getCache } = require("../utils");
require("../fb-admin-init");

const db = admin.database();
const cache = getCache();

module.exports = (program) => {
  program
    .command("reset-board-limit")
    .description("Reset the limit of board loading")
    .action(async () => {
      const boardsRef = db.ref("whiteboards");
      const boardsSnap = await boardsRef.once("value");
      const promises = [];

      boardsSnap.forEach((boardSnap) => {
        const promise = async () => {
          const boardRef = db.ref(`whiteboards/${boardSnap.key}`);
          const board = boardSnap.val();

          let user;

          if (Array.isArray(board.board_members)) {
            const boardOwnerId = board.board_members[0];
            // return `undefined` if not found in cache;
            user = cache.get(boardOwnerId);
            if (!user) {
              try {
                user = await getUser(idToEmail(boardOwnerId));
                cache.set(boardOwnerId, user);
              } catch (e) {
                if (
                  !["auth/user-not-found", "auth/invalid-email"].includes(
                    e.code
                  )
                ) {
                  throw e;
                }
              }
            }
          }

          const roleLoadLimits = user ? await getRoleLoadLimits(user) : 200;
          await boardRef.update({
            loadLimit: roleLoadLimits,
            isReportSent: false,
          });
        };

        promises.push(promise);
      });

      await pAll(promises, { concurrency: 5 });
      cache.clear();

      console.log("Update complete");
    });
};
