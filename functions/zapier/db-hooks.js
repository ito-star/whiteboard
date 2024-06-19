const functions = require("firebase-functions");
const admin = require("firebase-admin");
const isEqual = require("react-fast-compare");
const pMap = require("p-map");

const { idToEmail } = require("../utils");
const { dataPathPerType, BlockTypes } = require("../constant");
const { wrapEventFunction } = require("../sentry");

const {
  getBoardInfo,
  getBlockInfo: hooksGetBlockInfo,
} = require("../hooks/utils");

const adminEmail = "admin@whatboard.app";
const anonymousEmail = "anonymous@whatboard.app";

const getUserEmail = (context) => {
  if (context.authType === "ADMIN") {
    return adminEmail;
  }

  if (context.auth) {
    return context.auth.token.email || anonymousEmail;
  }

  return anonymousEmail;
};

const getBlockInfo = (block) => {
  const info = {
    ...hooksGetBlockInfo(block),
    // This property exists solely as a workaround for the
    // the fact that Firebase Realtime Database cannot handle
    // queries for more that one property at a time
    board_id_block_id: `${block.board_id}${block.id}`,
  };

  return info;
};

const zapierBoardCreated = async (boardId, board, userEmail) => {
  const boardInfo = getBoardInfo(boardId, board);
  const timestamp = new Date().toJSON();

  return pMap(board.board_members, async (boardMember) => {
    const pushRef = await admin
      .database()
      .ref(`zapier/${boardMember}/board_created`)
      .push();

    const newBoard = {
      id: pushRef.key,
      ...boardInfo,
      // eslint-disable-next-line camelcase
      user_who_created: userEmail,
      timestamp,
    };

    return pushRef.set(newBoard);
  });
};

// const zapierBoardUpdated = async (board) => {
//   const pushRef = await admin.database().ref(`zapier/${board.board_owner}/board_updated`).push();

//   const newBoard = {
//     id: pushRef.key,
//     // eslint-disable-next-line camelcase
//     board_id: board.board_id,
//     // eslint-disable-next-line camelcase
//     board_title: board.board_title,
//     // eslint-disable-next-line camelcase
//     board_owner: idToEmail(board.board_owner),
//     // eslint-disable-next-line camelcase
//     board_url: makeBoardUrl(board.board_id),
//     // eslint-disable-next-line camelcase
//     block_count: board.block_count,
//     // eslint-disable-next-line camelcase
//     is_shared: board.is_shared,
//     // eslint-disable-next-line camelcase
//     shared_count: board.shared_count,
//     // eslint-disable-next-line camelcase
//     is_public: board.is_public,
//     timestamp: new Date().toJSON(),
//   };

//   return pushRef.set(newBoard);
// };

const zapierBoardDeleted = async (boardId, board, userEmail) => {
  const boardInfo = getBoardInfo(boardId, board);
  const timestamp = new Date().toJSON();

  return pMap(board.board_members, async (boardMember) => {
    const pushRef = await admin
      .database()
      .ref(`zapier/${boardMember}/board_deleted`)
      .push();

    const newBoard = {
      id: pushRef.key,
      ...boardInfo,
      // eslint-disable-next-line camelcase
      user_who_deleted: userEmail,
      timestamp,
    };

    return pushRef.set(newBoard);
  });
};

const zapierBoardPublic = async (boardId, board, userEmail) => {
  const boardInfo = getBoardInfo(boardId, board);
  const timestamp = new Date().toJSON();

  return pMap(board.board_members, async (boardMember) => {
    const pushRef = await admin
      .database()
      .ref(`zapier/${boardMember}/board_public`)
      .push();

    const newBoard = {
      id: pushRef.key,
      ...boardInfo,
      // eslint-disable-next-line camelcase
      user_who_made_public: userEmail,
      timestamp,
    };

    return pushRef.set(newBoard);
  });
};

const zapierBoardPrivate = async (boardId, board, userEmail) => {
  const boardInfo = getBoardInfo(boardId, board);
  const timestamp = new Date().toJSON();

  return pMap(board.board_members, async (boardMember) => {
    const pushRef = await admin
      .database()
      .ref(`zapier/${boardMember}/board_private`)
      .push();

    const newBoard = {
      id: pushRef.key,
      ...boardInfo,
      // eslint-disable-next-line camelcase
      user_who_made_private: userEmail,
      timestamp,
    };

    return pushRef.set(newBoard);
  });
};

const zapierBoardArchived = async (boardId, board, userEmail) => {
  const boardInfo = getBoardInfo(boardId, board);
  const timestamp = new Date().toJSON();

  return pMap(board.board_members, async (boardMember) => {
    const pushRef = await admin
      .database()
      .ref(`zapier/${boardMember}/board_archived`)
      .push();

    const newBoard = {
      id: pushRef.key,
      ...boardInfo,
      // eslint-disable-next-line camelcase
      user_who_archived: userEmail,
      timestamp,
    };

    return pushRef.set(newBoard);
  });
};

const zapierBoardInvited = async (boardId, board, invite) => {
  const boardInfo = getBoardInfo(boardId, board);
  const timestamp = new Date().toJSON();

  return pMap(board.board_members, async (boardMember) => {
    const pushRef = await admin
      .database()
      .ref(`zapier/${boardMember}/board_invited`)
      .push();

    const newBoard = {
      id: pushRef.key,
      ...boardInfo,
      // eslint-disable-next-line camelcase
      invited_user_email: invite.email,
      // eslint-disable-next-line camelcase
      inviter_name: invite.sender_name,
      // eslint-disable-next-line camelcase
      inviter_email: invite.sender_email,
      timestamp,
    };

    return pushRef.set(newBoard);
  });
};

const zapierBoardViewed = async (boardId, board, log) => {
  const boardInfo = getBoardInfo(boardId, board);
  const timestamp = new Date().toJSON();

  return pMap(board.board_members, async (boardMember) => {
    const pushRef = await admin
      .database()
      .ref(`zapier/${boardMember}/board_viewed`)
      .push();

    const newBoard = {
      id: pushRef.key,
      ...boardInfo,
      // eslint-disable-next-line camelcase
      user_who_viewed: idToEmail(log.userId),
      // eslint-disable-next-line camelcase
      date_viewed: log.lastViewed,
      timestamp,
    };

    return pushRef.set(newBoard);
  });
};

const zapierBoardContentModified = async (boardId, board, log) => {
  const boardInfo = getBoardInfo(boardId, board);
  const timestamp = new Date().toJSON();

  return pMap(board.board_members, async (boardMember) => {
    const pushRef = await admin
      .database()
      .ref(`zapier/${boardMember}/board_content_modified`)
      .push();

    const newBoard = {
      id: pushRef.key,
      ...boardInfo,
      // eslint-disable-next-line camelcase
      user_who_modified: idToEmail(log.userId),
      // eslint-disable-next-line camelcase
      date_modified: log.lastModified,
      timestamp,
    };

    return pushRef.set(newBoard);
  });
};

const zapierBlockCreated = async (data) => {
  // eslint-disable-next-line camelcase
  const { board_id, board, block, block_content, block_creator } = data;
  const boardInfo = getBoardInfo(board_id, board);
  const blockInfo = getBlockInfo(block);
  const timestamp = new Date().toJSON();

  return pMap(board.board_members, async (boardMember) => {
    const pushRef = await admin
      .database()
      .ref(`zapier/${boardMember}/block_created`)
      .push();

    const newBoard = {
      id: pushRef.key,
      ...boardInfo,
      ...blockInfo,
      // eslint-disable-next-line camelcase
      block_content,
      // eslint-disable-next-line camelcase
      block_creator: idToEmail(block_creator),
      timestamp,
    };

    return pushRef.set(newBoard);
  });
};

const zapierBlockUpdated = async (data) => {
  // eslint-disable-next-line camelcase
  const { board_id, board, block, block_content, block_modifier } = data;
  const boardInfo = getBoardInfo(board_id, board);
  const blockInfo = getBlockInfo(block);
  const timestamp = new Date().toJSON();

  return pMap(board.board_members, async (boardMember) => {
    const pushRef = await admin
      .database()
      .ref(`zapier/${boardMember}/block_updated`)
      .push();

    const newBoard = {
      id: pushRef.key,
      ...boardInfo,
      ...blockInfo,
      // eslint-disable-next-line camelcase
      block_content,
      // eslint-disable-next-line camelcase
      block_modifier: idToEmail(block_modifier),
      timestamp,
    };

    return pushRef.set(newBoard);
  });
};

const zapierQAAnswersUpdated = async (data) => {
  const { board_id, board, block } = data;
  const boardInfo = getBoardInfo(board_id, board);
  const blockInfo = getBlockInfo(block);
  const timestamp = new Date().toJSON();
  const qaData = {};

  block.qa_data.forEach((item, index) => {
    qaData[`question${index + 1}`] = item.question;
    qaData[`answer${index + 1}`] = item.answer;
  });

  return pMap(board.board_members, async (boardMember) => {
    const pushRef = await admin
      .database()
      .ref(`zapier/${boardMember}/qaanswer_updated`)
      .push();

    const newBoard = {
      id: pushRef.key,
      ...boardInfo,
      ...blockInfo,
      ...qaData,
      timestamp,
    };

    return pushRef.set(newBoard);
  });
};

const zapierConversationUpdated = async (data) => {
  const { board_id, board, block, chat } = data;

  const boardInfo = getBoardInfo(board_id, board);
  const blockInfo = getBlockInfo(block);
  const timestamp = new Date().toJSON();

  return pMap(board.board_members, async (boardMember) => {
    const pushRef = await admin
      .database()
      .ref(`zapier/${boardMember}/conversation_updated`)
      .push();

    const newBoard = {
      id: pushRef.key,
      ...boardInfo,
      ...blockInfo,
      // eslint-disable-next-line camelcase
      new_message: chat.message,
      // eslint-disable-next-line camelcase
      message_sender: idToEmail(chat.sender_id),
      // eslint-disable-next-line camelcase
      message_sender_name: chat.sender,
      timestamp,
    };

    return pushRef.set(newBoard);
  });
};

const boardsDbPath = "/whiteboards/{board_id}";

exports.onBoardCreate = functions.database.ref(boardsDbPath).onCreate(
  wrapEventFunction(async (snap, context) => {
    const board = snap.val();

    await zapierBoardCreated(snap.key, board, getUserEmail(context));
  })
);

exports.onBoardDelete = functions.database.ref(boardsDbPath).onDelete(
  wrapEventFunction(async (snap, context) => {
    const board = snap.val();

    await zapierBoardDeleted(snap.key, board, getUserEmail(context));
  })
);

exports.onBoardPublicPrivate = functions.database.ref(boardsDbPath).onUpdate(
  wrapEventFunction(async (change, context) => {
    const { board_id } = context.params;
    const before = change.before.val();
    const after = change.after.val();

    if (after.unique_url) {
      let doTrigger = false;

      if (!before.unique_url !== after.unique_url) {
        doTrigger = true;
      }

      if (before.friendly_url !== after.friendly_url) {
        doTrigger = true;
      }

      if (doTrigger) {
        await zapierBoardPublic(board_id, after, getUserEmail(context));
      }
    } else {
      await zapierBoardPrivate(board_id, after, getUserEmail(context));
    }
  })
);

const userBoardsDbPath = "/users/{user_id}/whiteboards/{board_id}";

exports.onBoardArchived = functions.database
  .ref(`${userBoardsDbPath}/isArchived`)
  .onWrite(
    wrapEventFunction(async (change, context) => {
      const boardSnap = await change.before.ref.parent.get();
      const board = boardSnap.val();
      const isArchived = change.after.val();

      if (isArchived) {
        zapierBoardArchived(boardSnap.key, board, getUserEmail(context));
      }
    })
  );

const boardInvitesDbPath = "/invite-emails/{invite_id}";

exports.onBoardInvited = functions.database.ref(boardInvitesDbPath).onCreate(
  wrapEventFunction(async (snap) => {
    const invite = snap.val();
    const boardSnap = await admin
      .database()
      .ref(`/whiteboards/${invite.board_id}`)
      .get();
    const board = boardSnap.val();

    await zapierBoardInvited(boardSnap.key, board, invite);
  })
);

const boardViewLogsDbPath = `${boardsDbPath}/view_logs/{user_id}`;

exports.onBoardViewed = functions.database
  .ref(`${boardViewLogsDbPath}/lastViewed`)
  .onWrite(
    wrapEventFunction(async (change, context) => {
      const newLastViewed = change.after.val();

      if (newLastViewed && newLastViewed !== "cleared") {
        const { board_id, user_id } = context.params;

        const boardSnap = await admin
          .database()
          .ref(`/whiteboards/${board_id}`)
          .get();
        const board = boardSnap.val();

        const log = {
          userId: user_id,
          lastViewed: newLastViewed,
        };

        await zapierBoardViewed(board_id, board, log);
      }
    })
  );

exports.onBoardContentModified = functions.database
  .ref(`${boardViewLogsDbPath}/lastModified`)
  .onWrite(
    wrapEventFunction(async (change, context) => {
      const newLastModified = change.after.val();

      if (newLastModified && newLastModified !== "cleared") {
        const { board_id, user_id } = context.params;

        const boardSnap = await admin
          .database()
          .ref(`/whiteboards/${board_id}`)
          .get();
        const board = boardSnap.val();

        const log = {
          userId: user_id,
          lastModified: newLastModified,
        };

        await zapierBoardContentModified(board_id, board, log);
      }
    })
  );

const blocksDbPath = "/blocks/{board_id}/{block_id}";

exports.onBlockCreatedUpdated = functions.database.ref(blocksDbPath).onWrite(
  wrapEventFunction(async (change, context) => {
    const oldBlock = change.before.val();
    const newBlock = change.after.val();

    if (newBlock) {
      const boardSnap = await admin
        .database()
        .ref(`/whiteboards/${newBlock.board_id}`)
        .get();
      const board = boardSnap.val();

      const data = {
        board_id: boardSnap.key,
        board,
        block: newBlock,
      };

      if (!oldBlock) {
        // eslint-disable-next-line camelcase
        data.block_creator = newBlock.created_by;
        // eslint-disable-next-line camelcase
        data.block_content = "";

        await zapierBlockCreated(data);
      } else {
        let oldBlockContent = oldBlock[dataPathPerType[oldBlock.type]];
        let newBlockContent = newBlock[dataPathPerType[newBlock.type]];

        if (newBlock.type === BlockTypes.Checklist) {
          oldBlockContent = {
            checked: oldBlock.checked,
            data: oldBlockContent,
          };

          newBlockContent = {
            checked: newBlock.checked,
            data: newBlockContent,
          };
        }

        if (newBlock.type === BlockTypes.FileRequest) {
          oldBlockContent = Object.values(oldBlockContent || {});
          newBlockContent = Object.values(newBlockContent || {});
        }

        if (!isEqual(newBlockContent, oldBlockContent)) {
          // eslint-disable-next-line camelcase
          data.block_modifier = getUserEmail(context);

          if (
            [
              BlockTypes.Checklist,
              BlockTypes.QAForm,
              BlockTypes.Files,
              BlockTypes.Buttons,
              BlockTypes.FileRequest,
              BlockTypes.Grid,
            ].includes(newBlock.type)
          ) {
            newBlockContent = JSON.stringify(newBlockContent);
          }

          if (!newBlockContent) {
            newBlockContent = "";
          }

          // eslint-disable-next-line camelcase
          data.block_content = newBlockContent;

          await zapierBlockUpdated(data);
        }
      }
    }
  })
);

const qaDataDbPath = `${blocksDbPath}/qa_data`;

exports.onQAAnswersUpdated = functions.database.ref(qaDataDbPath).onUpdate(
  wrapEventFunction(async (change, context) => {
    const { board_id, block_id } = context.params;

    const blockSnap = await admin
      .database()
      .ref(`/blocks/${board_id}/${block_id}`)
      .once("value");
    const block = blockSnap.val();

    const boardSnap = await admin
      .database()
      .ref(`/whiteboards/${board_id}`)
      .once("value");
    const board = boardSnap.val();

    await zapierQAAnswersUpdated({
      board_id: boardSnap.key,
      board,
      block,
    });
  })
);

const conversationsDbPath = "/chats/{board_id}/{block_id}/{chat_id}";

exports.onConversationUpdated = functions.database
  .ref(conversationsDbPath)
  .onCreate(
    wrapEventFunction(async (snap, context) => {
      const { board_id, block_id } = context.params;
      const chat = snap.val();

      const blockSnap = await admin
        .database()
        .ref(`/blocks/${board_id}/${block_id}`)
        .get();
      const block = blockSnap.val();

      const boardSnap = await admin
        .database()
        .ref(`/whiteboards/${board_id}`)
        .get();
      const board = boardSnap.val();

      await zapierConversationUpdated({
        board_id,
        board,
        block,
        chat,
      });
    })
  );
