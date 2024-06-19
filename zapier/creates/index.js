const updateBoard = require("./updateBoard");
const deleteBoard = require("./deleteBoard");
const updateBlock = require("./updateBlock");
const deleteBlock = require("./deleteBlock");

module.exports = {
  [updateBoard.key]: updateBoard,
  [updateBlock.key]: updateBlock,
  [deleteBoard.key]: deleteBoard,
  [deleteBlock.key]: deleteBlock,
};
