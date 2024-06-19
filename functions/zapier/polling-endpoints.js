const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { BadRequest, NotFound } = require("http-errors");
const orderBy = require("lodash/orderBy");
const authenticate = require("../api/authenticate");
const errorHandler = require("../api/error-handler");
const { wrapHttpFunction } = require("../sentry");

/**
 * Retrieve the given list of Zapier trigger event for the given user
 *
 * The 100 most recent events are returned, in reverse-chronological order.
 *
 * @param {String} event
 * @param {Object} user
 *
 * @returns {Promise<Array>}
 */
const getZapierList = async (event, user, board_id, block_id) => {
  const path = `/zapier/${user.wbid}/${event}`;
  let ref = admin.database().ref(path);

  if (board_id && block_id) {
    ref = ref
      .orderByChild("board_id_block_id")
      .equalTo(`${board_id}${block_id}`);
  } else if (board_id) {
    ref = ref.orderByChild("board_id").equalTo(board_id);
  } else if (block_id) {
    throw new BadRequest("Must supply block_id and board_id together");
  }

  ref = ref.limitToLast(100);

  const snapshot = await ref.once("value");

  let result = [];

  if (snapshot.val()) {
    result = Object.values(snapshot.val());
  }

  const iteratees = [
    (eventObj) => {
      return new Date(eventObj.timestamp);
    },
  ];

  result = orderBy(result, iteratees, ["desc"]);

  return result;
};

const triggers = [
  `board_created`,
  `board_updated`,
  `board_deleted`,
  `board_public`,
  `board_private`,
  `board_archived`,
  `board_invited`,
  `board_viewed`,
  `board_content_modified`,
  `block_created`,
  `block_updated`,
  `qaanswer_updated`,
  `conversation_updated`,
];

exports.polling = functions.https.onRequest(
  wrapHttpFunction(async (req, res) => {
    try {
      const { trigger, board_id, block_id } = req.query;

      if (!trigger) {
        throw new NotFound("No trigger specified");
      }

      if (!triggers.includes(trigger)) {
        throw new NotFound(`Unknown trigger "${trigger}"`);
      }

      const user = await authenticate(req);
      const result = await getZapierList(trigger, user, board_id, block_id);

      res.json(result);
    } catch (e) {
      errorHandler(e, res);
    }
  })
);
