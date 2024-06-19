const config = require("../config");
const { getBoardIdField, getBlockIdField } = require("./utils");

module.exports = {
  key: "blockDelete",
  noun: "Block",
  display: {
    label: "Delete a Block",
    description: "Deletes an existing Block",
  },
  operation: {
    resource: "block",
    inputFields: [getBoardIdField("board_id"), getBlockIdField("id")],
    outputFields: [],
    sample: {
      ok: true,
    },
    perform: async (z, bundle) => {
      await z.request({
        method: "DELETE",
        url: `${config.WHATBOARD_API_URL}/blocks/${bundle.inputData.board_id}/${bundle.inputData.id}`,
      });

      return { ok: true };
    },
    performGet: async () => {
      return { ok: true };
    },
  },
};
