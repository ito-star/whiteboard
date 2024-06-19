const access = jest.genMockFromModule("../access");

const ROLES = {
  anonymous: {
    maxBoards: 0,
    maxStorage: 0,
  },
  free: {
    maxBoards: 5,
    maxStorage: 0,
  },
  basic: {
    maxBoards: 10,
    // 150 MB
    maxStorage: 157286400,
  },
  premium: {
    maxBoards: 50,
    // 500 MB
    maxStorage: 524288000,
  },
  "premium-plus": {
    maxBoards: 100,
    // 1 GB
    maxStorage: 1073741824,
  },
  special: {
    maxBoards: -1,
    maxStorage: -1,
  },
};

access.getRoles = jest.fn(() => ROLES);

module.exports = access;
