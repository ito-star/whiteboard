const config = require("../config");
const {
  getBlockInputFields,
  getBlockOutputFields,
  getBlockSample,
} = require("./utils");

const conversationUpdatedList = (z, bundle) => {
  // `z.console.log()` is similar to `console.log()`.
  z.console.log("conversation is updated");

  // You can build requests and our client will helpfully inject all the variables
  // you need to complete. You can also register middleware to control this.
  const requestOptions = {
    method: "GET",
    url: `${config.WHATBOARD_URL}/zapier-polling`,
    params: {
      trigger: "conversation_updated",
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
  key: "conversation_updated",

  // You'll want to provide some helpful display labels and descriptions
  // for users. Zapier will put them into the UX.
  noun: "Conversation_Updated",
  display: {
    label: "New Conversation Message",
    description: "Triggers when a new message is added to a conversation.",
    important: true,
  },

  // `operation` is where the business logic goes.
  operation: {
    // `inputFields` can define the fields a user could provide,
    // we'll pass them in as `bundle.inputData` later.
    type: "polling",
    inputFields: getBlockInputFields("conversation_updated"),

    perform: conversationUpdatedList,

    // In cases where Zapier needs to show an example record to the user, but we are unable to get a live example
    // from the API, Zapier will fallback to this hard-coded sample. It should reflect the data structure of
    // returned records, and have obviously dummy values that we can show to any user.
    sample: {
      ...getBlockSample(),
      // eslint-disable-next-line camelcase
      new_message: "new_message",
      // eslint-disable-next-line camelcase
      message_sender: "sender@gmail.com",
      // eslint-disable-next-line camelcase
      message_sender_name: "Sender Name",
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
      { key: "new_message", label: "New Message", type: "string" },
      { key: "message_sender", label: "Message Sender", type: "string" },
      {
        key: "message_sender_name",
        label: "Message Sender Name",
        type: "string",
      },
    ],
  },
};
