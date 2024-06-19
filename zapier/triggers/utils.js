const boardInputFields = [
  {
    key: "board_id",
    type: "string",
    label: "Board",
    dynamic: "boardList.id.board_name",
  },
];

exports.getBoardInputFields = () => {
  return boardInputFields;
};

// eslint-disable-next-line no-unused-vars
exports.getBlockInputFields = (trigger) => {
  const fields = [...boardInputFields];

  if (trigger !== "block_created") {
    fields.push({
      key: "block_id",
      type: "string",
      label: "Block",
      dynamic: "blockList.id.title",
    });
  }

  return fields;
};

const commonOutputFields = [
  { key: "id", label: "ID", type: "string" },
  { key: "timestamp", label: "Timestamp", type: "datetime" },
];

const boardOutputFields = [
  { key: "board_id", label: "Board ID", type: "string" },
  { key: "board_title", label: "Board Title", type: "string" },
  { key: "board_owner", label: "Board Owner", type: "string" },
  { key: "board_url", label: "Board URL", type: "string" },
  {
    key: "board_public_url",
    label: "Public Board URL",
    type: "string",
    helpText:
      "This field is only present if the Board has been been made publically accessible",
  },
];

exports.getBoardOutputFields = () => {
  return [...commonOutputFields, ...boardOutputFields];
};

exports.getBlockOutputFields = () => {
  return [
    ...commonOutputFields,
    ...boardOutputFields,
    { key: "block_id", label: "Block ID", type: "string" },
    { key: "block_title", label: "Block Title", type: "string" },
    { key: "block_type", label: "Block Type", type: "string" },
    { key: "block_owner", label: "Block Owner", type: "string" },
  ];
};

const commonSample = {
  id: "id",
  timestamp: "2020-12-15T19:03:58.514Z",
};

const boardSample = {
  // eslint-disable-next-line camelcase
  board_id: "abc123",
  // eslint-disable-next-line camelcase
  board_title: "my board",
  // eslint-disable-next-line camelcase
  board_owner: "board.owner@email.com",
  // eslint-disable-next-line camelcase
  board_url: "https://whatboard.app/board/abc123",
};

exports.getBoardSample = () => {
  return {
    ...commonSample,
    ...boardSample,
  };
};

exports.getBlockSample = () => {
  return {
    ...commonSample,
    ...boardSample,
    // eslint-disable-next-line camelcase
    block_id: "block123",
    // eslint-disable-next-line camelcase
    block_title: "my block",
    // eslint-disable-next-line camelcase
    block_type: "Text",
    // eslint-disable-next-line camelcase
    block_owner: "owner@gmail.com",
  };
};
