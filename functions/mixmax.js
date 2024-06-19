/* eslint-disable camelcase */
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const got = require("got");
const { emailToId, idToEmail } = require("./utils");

const { getBoardInfo, getBlockInfo } = require("./hooks/utils");

const { wrapEventFunction } = require("./sentry");

const conversationsDbPath = "/chats/{board_id}/{block_id}/{chat_id}";

const callWebhook = async (data) => {
  const { webhookURL, useWebhook } = data;

  if (webhookURL !== "" && useWebhook) {
    await got.post(webhookURL, {
      json: data,
      responseType: "json",
    });
  }
};

exports.onConversationUpdated = functions.database
  .ref(conversationsDbPath)
  .onCreate(
    wrapEventFunction(async (snap, context) => {
      const { board_id, block_id } = context.params;
      const { email } = context.auth.token;
      const chat = snap.val();

      const boardSnap = await admin
        .database()
        .ref(`/whiteboards/${board_id}`)
        .once("value");
      const board = boardSnap.val();

      const blockSnap = await admin
        .database()
        .ref(`/blocks/${board_id}/${block_id}`)
        .once("value");
      const block = blockSnap.val();

      if (
        !block.isFireMyActions &&
        board.board_members[0] === emailToId(email)
      ) {
        return;
      }

      await callWebhook({
        ...getBoardInfo(board_id, board),
        ...getBlockInfo(block),
        webhookURL: block.webhookURL,
        useWebhook: block.useWebhook,
        // eslint-disable-next-line camelcase
        new_message: chat.message,
        // eslint-disable-next-line camelcase
        message_sender: idToEmail(chat.sender_id),
        // eslint-disable-next-line camelcase
        message_sender_name: chat.sender,
        timestamp: chat.date,
      });
    })
  );
