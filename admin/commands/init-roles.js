const admin = require("firebase-admin");

require("../fb-admin-init");

const db = admin.database();

const ROLES = {
  anonymous: {
    maxBoards: 0,
    maxStorage: 0,
    maxBoardLoads: 0,
  },
  free: {
    maxBoards: 5,
    // 1 GB
    maxStorage: 1073741824,
    maxBoardLoads: 200,
  },
  basic: {
    maxBoards: 10,
    // 5 GB
    maxStorage: 5368709120,
    maxBoardLoads: 400,
  },
  premium: {
    maxBoards: 50,
    // 10 GB
    maxStorage: 10737418240,
    maxBoardLoads: 800,
  },
  "premium-plus": {
    maxBoards: 500,
    // 30 GB
    maxStorage: 32212254720,
    maxBoardLoads: -1,
  },
  special: {
    maxBoards: -1,
    maxStorage: -1,
    maxBoardLoads: -1,
  },
};

module.exports = (program) => {
  program
    .command("init-roles")
    .description("Initialize Whatboard Roles")
    .action(async () => {
      console.log("Setting up Whatboard Roles");
      const rolesRef = db.ref("roles");

      await rolesRef.set(ROLES);
    });
};
