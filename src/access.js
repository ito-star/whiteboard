import firebase from "firebase/compat/app";
import "firebase/compat/database";
import arrify from "arrify";
import filesize from "filesize";
import { isEmailSpecial, initFirebase } from "./utils";
import { BlockTypes, blockTypesInfo } from "./constant";

initFirebase();

let ROLES;

export const initRoles = async () => {
  const rolesRef = firebase.database().ref("roles");
  const rolesSnap = await rolesRef.once("value");

  if (!rolesSnap.exists()) {
    throw new Error(
      "Cannot find role information. To setup role information, follow the instructions in README to set up admin scripts, then run the command `npm run --silent admin -- init-roles`"
    );
  }

  ROLES = rolesSnap.val();
};

export const getRoles = () => {
  return ROLES;
};

export const PAID_ROLES = ["basic", "premium", "premium-plus"];
export const PREMIUM_ROLES = ["premium", "premium-plus"];

export const getRole = (user) => {
  if (user.token.claims.isSpecial) {
    return "special";
  }

  if (user.isAnonymous) {
    return "anonymous";
  }

  if (PAID_ROLES.includes(user.token.claims.stripeRole)) {
    return user.token.claims.stripeRole;
  }

  return "free";
};

const isAllowedRole = (role, roles) => {
  const allowedRoles = arrify(roles);

  return allowedRoles.includes(role);
};

const hasRole = (user, role) => {
  const userRole = getRole(user);

  return isAllowedRole(userRole, role);
};

export const canUpgradeRole = (role) => {
  const highTierRoles = ["premium-plus", "special"];

  return !isAllowedRole(role, highTierRoles);
};

/**
 * Determine whether or not a user can upgrade to a higher role
 *
 * This is mainly so we don't annoy admins and those have our
 * highest tier subscription.
 *
 * @param {object} user
 * @returns {boolean}
 */
export const canUpgrade = (user) => {
  const userRole = getRole(user);

  return canUpgradeRole(userRole);
};

export const canDowngradeRole = (role) => {
  if (role === "special") {
    return false;
  }

  return isAllowedRole(role, PAID_ROLES);
};

/**
 * Determine whether or not a user can downgrade to a lower role
 *
 * This is the inverse of canUpgrade()
 *
 * @param {object} user
 * @returns {boolean}
 */
export const canDowngrade = (user) => {
  const userRole = getRole(user);

  return canDowngradeRole(userRole);
};

const isBlockOwner = (block, user) => {
  return user && block.created_by === user.wbid;
};

const isBoardOwner = (board, user) => {
  return user && board.board_members[0] === user.wbid;
};

const toFriendlySize = (size, converter = String) => {
  if (size === -1 || size === Infinity) {
    return "∞";
  }

  return converter(size);
};

const access = {
  canAccessUsersReport(user) {
    return isEmailSpecial(user.email);
  },

  canEditBlock(block, user) {
    return !block.readOnly && isBlockOwner(block, user);
  },

  canDeleteBlock(block, board, user) {
    return (
      !block.readOnly &&
      (isBlockOwner(block, user) || isBoardOwner(board, user))
    );
  },

  canUploadFiles(user) {
    return this.getMaxStorageSize(user) !== 0;
  },

  // This is mostly here so we don't break the uploader. It will be removed
  // once the uploader has been modified to no longer use it.
  getMaxFileSize() {
    return null;
  },

  /**
   * Retrieve the maximum file storage space alloted to the given user
   *
   * -1 means "no limit".
   *
   * @param {object} user
   * @returns {number}
   */
  getMaxStorageSize(user) {
    let maxStorage = 0;

    if (!user) {
      return maxStorage;
    }

    const userRole = getRole(user);
    maxStorage = ROLES[userRole].maxStorage;

    return maxStorage;
  },

  /**
   * Convert a numeric storage size to a UI-friendly representation
   *
   * This is similar to getMaxStorageSize(), but returns something that is
   * more appropriate for being displayed in a UI. In cases where getMaxStorageSize()
   * would return -1, this method returns "∞".
   *
   * @param {object} user
   * @returns {string}
   */
  toFriendlyStorageSize(size) {
    return toFriendlySize(size, filesize);
  },

  /**
   * Retrieve a UI-friendly maximum file storage space alloted to the given user
   *
   * This is similar to getMaxStorageSize(), but returns something that is
   * more appropriate for being displayed in a UI. In cases where getMaxStorageSize()
   * would return -1, this method returns "∞".
   *
   * @param {object} user
   * @returns {string}
   */
  getFriendlyMaxStorageSize(user) {
    const maxStorage = this.getMaxStorageSize(user);

    return this.toFriendlyStorageSize(maxStorage);
  },

  hasEnoughStorageSpace(size, user) {
    const maxStorage = this.getMaxStorageSize(user);
    const usage = user.usage.storage;

    if (maxStorage === -1) {
      return true;
    }

    return usage + size <= maxStorage;
  },

  canDeleteBoard: isBoardOwner,

  canShareBoard: isBoardOwner,

  canLeaveBoard(board, user) {
    return (
      user &&
      board.board_members.includes(user.wbid) &&
      !isBoardOwner(board, user)
    );
  },

  canEditBoard: isBoardOwner,

  canTidyBoard: isBoardOwner,

  isBoardOwner,

  isBlockOwner,

  /**
   * Retrieve the maximum number of boards the given user can
   * create.
   *
   * -1 means "no limit".
   *
   * @param {object} user
   * @returns {number}
   */
  getMaxBoardCount(user) {
    let maxBoardCount = 0;

    if (!user) {
      return maxBoardCount;
    }

    const userRole = getRole(user);
    maxBoardCount = ROLES[userRole].maxBoards;

    return maxBoardCount;
  },

  /**
   * Convert a number board count to a UI-friendly representation
   *
   * This is similar to getMaxBoardsCount(), but returns something that is
   * more appropriate for being displayed in a UI. In cases where getMaxBoardsCount()
   * would return -1, this method returns "∞".
   *
   * @param {object} user
   * @returns {string}
   */
  toFriendlyBoardCount(count) {
    return toFriendlySize(count);
  },

  /**
   * Retrieve a UI-friendly maximum number of boards the given user can
   * create.
   *
   * This is similar to getMaxBoardsCount(), but returns something that is
   * more appropriate for being displayed in a UI. In cases where getMaxBoardsCount()
   * would return -1, this method returns "∞".
   *
   * @param {object} user
   * @returns {string}
   */
  getFriendlyMaxBoardCount(user) {
    const maxBoardCount = this.getMaxBoardCount(user);
    return this.toFriendlyBoardCount(maxBoardCount);
  },

  canCreateBoards(user) {
    const maxBoardCount = this.getMaxBoardCount(user);
    const ownedBoardsCount = user.usage.boards;

    if (maxBoardCount === -1) {
      return true;
    }

    return ownedBoardsCount < maxBoardCount;
  },

  canMakeBoardPublic(board, user) {
    if (!user) {
      return false;
    }

    const allowedRoles = [...PREMIUM_ROLES, "special"];

    return isBoardOwner(board, user) && hasRole(user, allowedRoles);
  },

  canProtectBoard(board, user) {
    if (!user) {
      return false;
    }

    const allowedRoles = [...PAID_ROLES, "special"];

    return isBoardOwner(board, user) && hasRole(user, allowedRoles);
  },

  canCreateBlocksOfType(blockType, user) {
    if (!user) {
      return false;
    }

    const blockTypeInfo = blockTypesInfo[blockType];

    if (!blockTypeInfo) {
      throw new Error(`Unknown Block type "${blockType}"`);
    }

    const paidBlockTypes = [
      BlockTypes.ScriptEmbed,
      BlockTypes.QAForm,
      BlockTypes.FileRequest,
    ];
    const paidRoles = [...PAID_ROLES, "special"];

    if (paidBlockTypes.includes(blockType)) {
      return hasRole(user, paidRoles);
    }

    return true;
  },

  getMaxBoardLoads(user) {
    const role = getRole(user);
    return ROLES[role].maxBoardLoads;
  },

  canUploadBrandingImage(user) {
    const roles = ["premium-plus", "special"];

    return hasRole(user, roles);
  },
};

export default access;
