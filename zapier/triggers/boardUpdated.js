const config = require("../config");

const updatedBoardList = (z) => {
  // `z.console.log()` is similar to `console.log()`.
  z.console.log("board is updated");

  // You can build requests and our client will helpfully inject all the variables
  // you need to complete. You can also register middleware to control this.
  const requestOptions = {
    method: "GET",
    url: `${config.WHATBOARD_URL}/zapier-polling`,
    params: {
      trigger: "board_updated",
    },
  };

  // You may return a promise or a normal data structure from any perform method.
  return z.request(requestOptions).then((response) => response.data);
};

// We recommend writing your triggers separate like this and rolling them
// into the App definition at the end.
module.exports = {
  key: "board_updated",

  // You'll want to provide some helpful display labels and descriptions
  // for users. Zapier will put them into the UX.
  noun: "Board_Updated",
  display: {
    label: "Board Updated",
    description: "Triggers when a board is updated.",
  },

  // `operation` is where the business logic goes.
  operation: {
    // `inputFields` can define the fields a user could provide,
    // we'll pass them in as `bundle.inputData` later.
    type: "polling",
    inputFields: [],

    perform: updatedBoardList,

    // In cases where Zapier needs to show an example record to the user, but we are unable to get a live example
    // from the API, Zapier will fallback to this hard-coded sample. It should reflect the data structure of
    // returned records, and have obviously dummy values that we can show to any user.
    sample: {
      id: "id",
      // eslint-disable-next-line camelcase
      board_id: "abc123",
      // eslint-disable-next-line camelcase
      board_title: "my board",
      // eslint-disable-next-line camelcase
      board_owner: "board.owner@email.com",
      // eslint-disable-next-line camelcase
      board_url: "https://whatboard.app/board/abc123",
      // eslint-disable-next-line camelcase
      block_count: "5",
      // eslint-disable-next-line camelcase
      is_shared: "True",
      // eslint-disable-next-line camelcase
      shared_count: "3",
      // eslint-disable-next-line camelcase
      is_public: "True",
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
      { key: "id", label: "ID" },
      { key: "board_id", label: "Board ID" },
      { key: "board_title", label: "Board Title" },
      { key: "board_owner", label: "Board Owner" },
      { key: "board_url", label: "Board URL" },
      { key: "block_count", label: "Block Count" },
      { key: "is_shared", label: "Shared/Unshared" },
      { key: "shared_count", label: "Shared Count" },
      { key: "is_public", label: "Public/Private" },
    ],
  },
};
