const config = require("../config");
const {
  getBoardInputFields,
  getBoardOutputFields,
  getBoardSample,
} = require("./utils");

const publicBoardList = (z, bundle) => {
  // `z.console.log()` is similar to `console.log()`.
  z.console.log("board content is modified");

  // You can build requests and our client will helpfully inject all the variables
  // you need to complete. You can also register middleware to control this.
  const requestOptions = {
    method: "GET",
    url: `${config.WHATBOARD_URL}/zapier-polling`,
    params: {
      trigger: "board_content_modified",
      board_id: bundle.inputData.board_id,
    },
  };

  // You may return a promise or a normal data structure from any perform method.
  return z.request(requestOptions).then((response) => response.data);
};

// We recommend writing your triggers separate like this and rolling them
// into the App definition at the end.
module.exports = {
  key: "board_content_modified",

  // You'll want to provide some helpful display labels and descriptions
  // for users. Zapier will put them into the UX.
  noun: "Board_Content_Modified",
  display: {
    label: "Board Content Modified",
    description:
      "Triggers when the contents of a board have been modified in any way. If you want more details on exactly what was modified, use one of the block-related triggers.",
  },

  // `operation` is where the business logic goes.
  operation: {
    // `inputFields` can define the fields a user could provide,
    // we'll pass them in as `bundle.inputData` later.
    type: "polling",
    inputFields: getBoardInputFields(),

    perform: publicBoardList,

    // In cases where Zapier needs to show an example record to the user, but we are unable to get a live example
    // from the API, Zapier will fallback to this hard-coded sample. It should reflect the data structure of
    // returned records, and have obviously dummy values that we can show to any user.
    sample: {
      ...getBoardSample(),
      // eslint-disable-next-line camelcase
      user_who_viewed: "user@example.com",
      // eslint-disable-next-line camelcase
      date_viewed: "2020-12-15T19:03:58.414Z",
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
      ...getBoardOutputFields(),
      { key: "user_who_made_public", label: "User who make a board public" },
    ],
  },
};
