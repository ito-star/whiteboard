const {
  idToEmail,
  makeBoardPublicUrl,
  makeBoardUrl,
  makeBoardFriendlyUrl,
} = require("../utils");

exports.getBoardInfo = (boardId, board) => {
  const boardOwner = board.board_members[0];

  const info = {
    // eslint-disable-next-line camelcase
    board_id: boardId,
    // eslint-disable-next-line camelcase
    board_title: board.board_name,
    // eslint-disable-next-line camelcase
    board_owner: idToEmail(boardOwner),
    // eslint-disable-next-line camelcase
    board_url: makeBoardUrl(boardId),
    ...(board.unique_url && {
      // eslint-disable-next-line camelcase
      board_public_url: makeBoardPublicUrl(boardId, board.unique_url),
    }),
    ...(board.friendly_url && {
      // eslint-disable-next-line camelcase
      board_public_friendly_url: makeBoardFriendlyUrl(board.friendly_url),
    }),
  };

  return info;
};

exports.getBlockInfo = (block) => {
  const info = {
    // eslint-disable-next-line camelcase
    block_id: block.id,
    // eslint-disable-next-line camelcase
    block_title: block.title,
    // eslint-disable-next-line camelcase
    block_type: block.type,
    // eslint-disable-next-line camelcase
    block_owner: idToEmail(block.created_by),
    // eslint-disable-next-line camelcase
    block_color: block.color || "#ffffff",
  };

  return info;
};
