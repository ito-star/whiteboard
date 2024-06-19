const Board = require("./board");
const { Block } = require("./block");

module.exports = {
  [Board.key]: Board,
  [Block.key]: Block,
};
