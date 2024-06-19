const admin = require("firebase-admin");
const arrify = require("arrify");
const { emailToId, isFunctionsEmulator, idToEmail } = require("./utils");

const { blockTypesInfo, BlockTypes, ThemeColors } = require("./constant");

/**
 * Create a Whatboard user object from a Firebase UserRecord
 *
 * @param { import("firebase-admin").auth.UserRecord } fbUser
 */
exports.makeUser = async (fbUser) => {
  const user = {
    wbid: fbUser.email && emailToId(fbUser.email),
    uid: fbUser.uid,
    isAnonymous: !fbUser.providerData || !fbUser.providerData.length,
    email: fbUser.email,
    emailVerified: fbUser.emailVerified,
    displayName: fbUser.displayName || fbUser.email || "Guest",
    photoURL: fbUser.photoURL,
    providerData: fbUser.providerData,
    token: {
      claims: fbUser.customClaims || {},
    },
    usage: {
      boards: 0,
      storage: 0,
    },
    branding: {
      boardBodyColor: ThemeColors.NOCOLOR,
      boardHeaderColor: ThemeColors.NOCOLOR,
    },
  };

  if (user.wbid) {
    const usageRef = admin.database().ref(`metadata/${user.wbid}/usage`);
    const usageSnap = await usageRef.once("value");

    if (usageSnap.exists()) {
      user.usage = {
        ...user.usage,
        ...usageSnap.val(),
      };
    }

    const brandingRef = admin.database().ref(`users/${user.wbid}/branding`);
    const brandingSnap = await brandingRef.once("value");

    if (brandingSnap.exists()) {
      user.branding = {
        ...user.branding,
        ...brandingSnap.val(),
      };
    }
  }

  return user;
};

/**
 * Create a Whatboard user object from a Firebase UID
 *
 * @param {string} uid
 */
exports.makeUserFromUid = async (uid) => {
  const fbUser = await admin.auth().getUser(uid);

  return exports.makeUser(fbUser);
};

/**
 * Create a Whatboard user object from an email address
 *
 * @param {string} email
 */
exports.makeUserFromEmail = async (email) => {
  const fbUser = await admin.auth().getUserByEmail(email);

  return exports.makeUser(fbUser);
};

/**
 * Create a Whatboard user object from a Whatboard WBID
 *
 * @param {string} wbid
 */
exports.makeUserFromWbId = async (wbid) => {
  const email = idToEmail(wbid);

  return exports.makeUserFromEmail(email);
};

let ROLES;

exports.getRoles = async () => {
  if (isFunctionsEmulator() || ROLES === undefined) {
    const rolesRef = admin.database().ref("roles");
    const rolesSnap = await rolesRef.once("value");

    if (!rolesSnap.exists()) {
      throw new Error(
        "Cannot find role information. To setup role information, follow the instructions in README to set up admin scripts, then run the command `npm run --silent admin -- init-roles`"
      );
    }

    ROLES = rolesSnap.val();
  }

  return ROLES;
};

const PAID_ROLES = ["basic", "premium", "premium-plus"];
const PREMIUM_ROLES = ["premium", "premium-plus"];

const getRole = (user) => {
  const claims = (user.token && user.token.claims) || user.customClaims;

  if (claims.isSpecial) {
    return "special";
  }

  if (user.isAnonymous) {
    return "anonymous";
  }

  if (PAID_ROLES.includes(claims.stripeRole)) {
    return claims.stripeRole;
  }

  return "free";
};

const hasRole = (user, role) => {
  const userRole = getRole(user);
  const allowedRoles = arrify(role);

  return allowedRoles.includes(userRole);
};

const isPaidUser = (user) => {
  const paidRoles = [...PAID_ROLES, "special"];

  return hasRole(user, paidRoles);
};

const isPremiumUser = (user) => {
  const allowedRoles = [...PREMIUM_ROLES, "special"];

  return hasRole(user, allowedRoles);
};

exports.access = {
  async canUploadFiles(user) {
    const maxStorageSize = await this.getMaxStorageSize(user);
    return maxStorageSize !== 0;
  },

  /**
   * Retrieve the maximum file storage space alloted to the given user
   *
   * -1 means "no limit".
   *
   * @param {object} user
   * @returns {Promise<number>}
   */
  async getMaxStorageSize(user) {
    let maxStorage = 0;

    const userRole = getRole(user);
    const roles = await exports.getRoles();
    maxStorage = roles[userRole].maxStorage;

    return maxStorage;
  },

  async getMaxBoardLoads(user) {
    let maxBoardLoads = 0;

    const userRole = getRole(user);
    const roles = await exports.getRoles();
    maxBoardLoads = roles[userRole].maxBoardLoads;

    return maxBoardLoads;
  },

  async hasEnoughStorageSpace(size, user) {
    const maxStorage = await this.getMaxStorageSize(user);
    const usage = user.usage.storage;

    if (maxStorage === -1) {
      return true;
    }

    return usage + size <= maxStorage;
  },

  /**
   * Retrieve the maximum number of boards the given user can
   * create.
   *
   * -1 means "no limit".
   *
   * @param {object} user
   * @returns {Promise<number>}
   */
  async getMaxBoardCount(user) {
    let maxBoardCount = 0;

    const userRole = getRole(user);
    const roles = await exports.getRoles();
    maxBoardCount = roles[userRole].maxBoards;

    return maxBoardCount;
  },

  async canCreateBoards(user) {
    const maxBoardCount = await this.getMaxBoardCount(user);
    const ownedBoardsCount = user.usage.boards;

    if (maxBoardCount === -1) {
      return true;
    }

    return ownedBoardsCount < maxBoardCount;
  },

  async canMakeBoardsPublic(user) {
    return isPremiumUser(user);
  },

  canCreateBlocksOfType(blockType, user) {
    const blockTypeInfo = blockTypesInfo[blockType];

    if (!blockTypeInfo) {
      throw new Error(`Unknown Block type "${blockType}"`);
    }

    const paidBlockTypes = [
      BlockTypes.ScriptEmbed,
      BlockTypes.QAForm,
      BlockTypes.FileRequest,
    ];

    if (paidBlockTypes.includes(blockType)) {
      return isPaidUser(user);
    }

    return true;
  },

  canAccessBrowserExtension(user) {
    return isPaidUser(user);
  },

  canAccessZapierIntegration(user) {
    return isPaidUser(user);
  },
};
