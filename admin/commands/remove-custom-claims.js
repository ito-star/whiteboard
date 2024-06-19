const admin = require("firebase-admin");
const { getUser, getUidOptionParams } = require("../utils");

module.exports = (program) => {
  program
    .command("remove-custom-claims")
    .description("Remove custom claims for a user")
    .arguments("<email>")
    .option("-s, --special", 'Make user "special"')
    .option("-a, --admin", "Make user an admin")
    .option(...getUidOptionParams())
    .action(async (email, cmdObj) => {
      console.log("Removing custom claims for %s", email);

      let user = await getUser(email, cmdObj.uid);

      const existingClaims = user.customClaims || {};

      if (cmdObj.special) {
        delete existingClaims.isSpecial;
      }

      if (cmdObj.admin) {
        delete existingClaims.isAdmin;
      }

      await admin.auth().setCustomUserClaims(user.uid, {
        ...existingClaims,
      });

      user = await getUser(email, cmdObj.uid);
      console.log(user);
    });
};
