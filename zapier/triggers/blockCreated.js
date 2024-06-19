const config = require("../config");
const {
  getBlockInputFields,
  getBlockOutputFields,
  getBlockSample,
} = require("./utils");

const createdBlockList = (z, bundle) => {
  // `z.console.log()` is similar to `console.log()`.
  z.console.log("block is created");

  // You can build requests and our client will helpfully inject all the variables
  // you need to complete. You can also register middleware to control this.
  const requestOptions = {
    method: "GET",
    url: `${config.WHATBOARD_URL}/zapier-polling`,
    params: {
      trigger: "block_created",
      board_id: bundle.inputData.board_id,
    },
  };

  // You may return a promise or a normal data structure from any perform method.
  return z.request(requestOptions).then((response) => response.data);
};

// We recommend writing your triggers separate like this and rolling them
// into the App definition at the end.
module.exports = {
  key: "block_created",

  // You'll want to provide some helpful display labels and descriptions
  // for users. Zapier will put them into the UX.
  noun: "Block_Created",
  display: {
    label: "Block Created",
    description: "Triggers when a block is created.",
    important: true,
  },

  // `operation` is where the business logic goes.
  operation: {
    // `inputFields` can define the fields a user could provide,
    // we'll pass them in as `bundle.inputData` later.
    type: "polling",
    inputFields: getBlockInputFields("block_created"),

    perform: createdBlockList,

    // In cases where Zapier needs to show an example record to the user, but we are unable to get a live example
    // from the API, Zapier will fallback to this hard-coded sample. It should reflect the data structure of
    // returned records, and have obviously dummy values that we can show to any user.
    sample: {
      ...getBlockSample(),
      // eslint-disable-next-line camelcase
      block_content: "block content",
      // eslint-disable-next-line camelcase
      block_creator: "owner@gmail.com",
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
        key: "block_creator",
        label: "User who created a block",
        type: "string",
      },
    ],
  },
};
