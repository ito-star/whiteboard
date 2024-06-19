const admin = require("firebase-admin");
const { getUser, getUidOptionParams } = require("../utils");

module.exports = (program) => {
  program
    .command("give-sub-role")
    .description("Give a user a subscription role")
    .arguments("<email> <role>")
    .option(...getUidOptionParams())
    .action(async (email, role, cmdObj) => {
      console.log("Giving subcription role %s to %s", role, email);

      let user = await getUser(email, cmdObj.uid);

      const existingClaims = user.customClaims || {};
      const newClaims = {
        stripeRole: role,
      };

      await admin.auth().setCustomUserClaims(user.uid, {
        ...existingClaims,
        ...newClaims,
      });

      user = await getUser(email, cmdObj.uid);
      console.log(user);
    });
};
