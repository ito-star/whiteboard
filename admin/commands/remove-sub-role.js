const admin = require("firebase-admin");
const { getUser, getUidOptionParams } = require("../utils");

module.exports = (program) => {
  program
    .command("remove-sub-role")
    .description("Remove a subscription role from a user")
    .arguments("<email>")
    .option(...getUidOptionParams())
    .action(async (email, cmdObj) => {
      console.log("Removing subcription role %s", email);

      let user = await getUser(email, cmdObj.uid);

      const existingClaims = user.customClaims || {};
      delete existingClaims.stripeRole;

      await admin.auth().setCustomUserClaims(user.uid, {
        ...existingClaims,
      });

      user = await getUser(email, cmdObj.uid);
      console.log(user);
    });
};
