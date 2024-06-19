const config = require("../config");
const {
  getBlockInputFields,
  getBlockOutputFields,
  getBlockSample,
} = require("./utils");

const updatedBlockList = (z, bundle) => {
  // `z.console.log()` is similar to `console.log()`.
  z.console.log("block is updated");

  // You can build requests and our client will helpfully inject all the variables
  // you need to complete. You can also register middleware to control this.
  const requestOptions = {
    method: "GET",
    url: `${config.WHATBOARD_URL}/zapier-polling`,
    params: {
      trigger: "block_updated",
      board_id: bundle.inputData.board_id,
      block_id: bundle.inputData.block_id,
    },
  };

  // You may return a promise or a normal data structure from any perform method.
  return z.request(requestOptions).then((response) => response.data);
};

// We recommend writing your triggers separate like this and rolling them
// into the App definition at the end.
module.exports = {
  key: "block_updated",

  // You'll want to provide some helpful display labels and descriptions
  // for users. Zapier will put them into the UX.
  noun: "Block_Updated",
  display: {
    label: "Block Updated",
    description:
      'Triggers when a block is updated. Note: This does not trigger for new chat messages in a Chat Block. If you want that, use the "New Conversation Message" trigger instead.',
  },

  // `operation` is where the business logic goes.
  operation: {
    // `inputFields` can define the fields a user could provide,
    // we'll pass them in as `bundle.inputData` later.
    type: "polling",
    inputFields: getBlockInputFields("block_updated"),

    perform: updatedBlockList,

    // In cases where Zapier needs to show an example record to the user, but we are unable to get a live example
    // from the API, Zapier will fallback to this hard-coded sample. It should reflect the data structure of
    // returned records, and have obviously dummy values that we can show to any user.
    sample: {
      ...getBlockSample(),
      // eslint-disable-next-line camelcase
      block_content: "block content",
      // eslint-disable-next-line camelcase
      block_modifier: "owner@gmail.com",
    },

    // If the resource can have fields that are custom on a per-user basis, define a function to fetch the custom
    // field definitions. The result will be used to augment the sample.
    //   outputFields: [
    //    () => { return []; }
    //   ]
    // For a more complete example of using dynamic fields see
    // https://github.com/zapier/zapier-platform-cli#customdynamic-fields.
    // Alternatively, a static field definition should be provided, to specify labels for the fields
    outputFields: [
      ...getBlockOutputFields(),
      { key: "block_content", label: "Block Content", type: "string" },
      {
        key: "block_modifier",
        label: "User who updated a block",
        type: "string",
      },
    ],
  },
};
