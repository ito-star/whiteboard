const admin = require("firebase-admin");
const { getUser, getUidOptionParams } = require("../utils");

module.exports = (program) => {
  program
    .command("setup-custom-claims")
    .description("Set up custom claims for a user")
    .arguments("<email>")
    .option("-s, --special", 'Make user "special"')
    .option("-a, --admin", "Make user an admin")
    .option(...getUidOptionParams())
    .action(async (email, cmdObj) => {
      console.log("Setting up custom claims for %s", email);

      let user = await getUser(email, cmdObj.uid);

      const existingClaims = user.customClaims || {};
      const newClaims = {};

      if (cmdObj.special) {
        newClaims.isSpecial = true;
      }

      if (cmdObj.admin) {
        newClaims.isAdmin = true;
      }

      await admin.auth().setCustomUserClaims(user.uid, {
        ...existingClaims,
        ...newClaims,
      });

      user = await getUser(email, cmdObj.uid);
      console.log(user);
    });
};
