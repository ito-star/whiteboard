const config = require("../config");
const { getBoardIdField } = require("./utils");

module.exports = {
  key: "boardDelete",
  noun: "Board",
  display: {
    label: "Delete a Board",
    description: "Deletes an existing Board",
  },
  operation: {
    resource: "board",
    inputFields: [getBoardIdField("id")],
    outputFields: [],
    sample: {
      ok: true,
    },
    perform: async (z, bundle) => {
      await z.request({
        method: "DELETE",
        url: `${config.WHATBOARD_API_URL}/boards/${bundle.inputData.id}`,
      });

      return { ok: true };
    },
    performGet: async () => {
      return { ok: true };
    },
  },
};
