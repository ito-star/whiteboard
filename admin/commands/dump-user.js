const { getUser, getUidOptionParams } = require("../utils");

module.exports = (program) => {
  program
    .command("dump-user")
    .description("Dump a Firebase Auth User record")
    .arguments("<email>")
    .option(...getUidOptionParams())
    .action(async (email, cmdObj) => {
      try {
        const user = await getUser(email, cmdObj.uid);

        console.log(user);
      } catch (e) {
        if (e.code === "auth/user-not-found") {
          throw new Error(`User ${email} not found!`);
        } else {
          throw e;
        }
      }
    });
};
