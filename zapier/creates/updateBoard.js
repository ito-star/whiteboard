const config = require("../config");
const { getBoardIdField } = require("./utils");
const boardResource = require("../resources/board");

module.exports = {
  key: "boardUpdate",
  noun: "Board",
  display: {
    label: "Update a Board",
    description: "Updates an existing Board",
  },
  operation: {
    resource: "board",
    inputFields: [
      getBoardIdField("id"),
      ...boardResource.create.operation.inputFields,
    ],
    perform: async (z, bundle) => {
      const board = {
        board_name: bundle.inputData.board_name,
        board_header_color: bundle.inputData.board_header_color,
        boardBodyColor: bundle.inputData.boardBodyColor,
        isPublic: bundle.inputData.isPublic,
        friendly_url: bundle.inputData.friendly_url,
        isArchived: bundle.inputData.isArchived,
        pinned: bundle.inputData.pinned,
      };

      const response = await z.request({
        method: "PATCH",
        url: `${config.WHATBOARD_API_URL}/boards/${bundle.inputData.id}`,
        json: board,
      });

      return response.data;
    },
  },
};
