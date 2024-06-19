const functions = require("firebase-functions");
const { wrapEventFunction } = require("./sentry");

const dbPath = "/chats/{board_id}/{block_id}/{chat_id}";

exports.onCreate = functions.database.ref(dbPath).onCreate(
  wrapEventFunction(async (snapshot, context) => {
    const { board_id, block_id, chat_id } = context.params;

    const chat = snapshot.val();

    await snapshot.ref.root
      .child(`user-chats/${chat.sender_id}/${chat_id}`)
      .set({
        board_id,
        block_id,
        chat_id,
      });
  })
);

exports.onDelete = functions.database.ref(dbPath).onDelete(
  wrapEventFunction(async (snapshot, context) => {
    const { chat_id } = context.params;

    const chat = snapshot.val();

    await snapshot.ref.root
      .child(`user-chats/${chat.sender_id}/${chat_id}`)
      .remove();
  })
);
