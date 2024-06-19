exports.getBoardIdField = (key) => {
  return {
    key,
    type: "string",
    label: "Board",
    dynamic: "boardList.id.board_name",
    search: "boardSearch.id",
    required: true,
  };
};

exports.getBlockIdField = (key) => {
  return {
    key,
    type: "string",
    label: "Block",
    dynamic: "blockList.id.title",
    search: "blockSearch.id",
    required: true,
  };
};
