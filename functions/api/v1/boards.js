const express = require("express");
const _ = require("lodash");
const { NotFound } = require("http-errors");
const {
  createUUID,
  makeBoardUrl,
  makeBoardPublicUrl,
  makeBoardFriendlyUrl,
} = require("../../utils");
const { getObjectList } = require("./utils");
const { access } = require("../../access");
const { ThemeColors } = require("../../constant");

const boards = express.Router();

const userSpecificFields = ["isArchived", "pinned"];

const normalize = (id, board) => {
  const normalized = {
    board_header_color: ThemeColors.NOCOLOR,
    boardBodyColor: ThemeColors.NOCOLOR,
    ...board,
    id,
    boardUrl: makeBoardUrl(id),
    ...(board.unique_url && {
      boardPublicUrl: makeBoardPublicUrl(id, board.unique_url),
    }),
    ...(board.friendly_url && {
      boardPublicFriendlyUrl: makeBoardFriendlyUrl(board.friendly_url),
    }),
    isPublic: Boolean(board.unique_url),
    isSecured: Boolean(board.password),
  };

  delete normalized.password;

  return normalized;
};

const getOne = async (req, id, user) => {
  const snap = await req.firebase
    .database()
    .ref(`whiteboards/${id}`)
    .once("value");
  let board = snap.val();

  if (!board) {
    throw new NotFound(`Cannot find Board with ID "${id}"`);
  }

  const userSnap = await req.firebase
    .database()
    .ref(`users/${user.wbid}/whiteboards/${id}`)
    .once("value");
  const userBoard = userSnap.val();

  if (userBoard) {
    const userSpecific = _.pick(userBoard, userSpecificFields);
    board = {
      ...board,
      ...userSpecific,
    };
  }

  board = normalize(id, board);

  return board;
};

const saveBoard = async (req, res, data) => {
  let { boardId: id } = req.params;
  const { user } = res.locals;

  let prevBoard;

  const db = req.firebase.database();

  if (id) {
    prevBoard = await getOne(req, id, user);
  }

  let isPublic;

  if (prevBoard) {
    isPublic = prevBoard.isPublic;
  }

  const {
    board_name,
    board_members,
    board_header_color,
    boardBodyColor,
    friendly_url,
    isArchived,
    pinned,
  } = data;

  if (typeof data.isPublic !== "undefined") {
    isPublic = data.isPublic;
  }

  let updates = {
    board_name,
    board_members,
    board_header_color,
    boardBodyColor,
    isArchived,
    pinned,
  };

  if (!prevBoard) {
    updates.board_members = [user.wbid];
    updates.date_created = new Date().toJSON();
    updates.loadLimit = await access.getMaxBoardLoads(user);

    if (!board_header_color) {
      updates.board_header_color = user.branding.boardHeaderColor;
    }

    if (!boardBodyColor) {
      updates.boardBodyColor = user.branding.boardBodyColor;
    }
  } else {
    if (typeof board_header_color !== "undefined" && !board_header_color) {
      updates.board_header_color = user.branding.boardHeaderColor;
    }

    if (typeof boardBodyColor !== "undefined" && !boardBodyColor) {
      updates.boardBodyColor = user.branding.boardBodyColor;
    }
  }

  if (isPublic) {
    if (!prevBoard || !prevBoard.unique_url) {
      updates.unique_url = createUUID();
    }

    updates.friendly_url = friendly_url;
  } else if (typeof isPublic !== "undefined" && !isPublic) {
    updates.unique_url = null;
    updates.friendly_url = null;
  }

  updates = _.omitBy(updates, _.isUndefined);

  if (!prevBoard) {
    const pushSnap = await db
      .ref(`users/${user.wbid}/whiteboards`)
      .push(updates);

    id = pushSnap.key;
  }

  const updateObj = {};

  Object.keys(updates).forEach((key) => {
    let path = `whiteboards`;

    if (userSpecificFields.includes(key)) {
      path = `users/${user.wbid}/whiteboards`;
    }

    path = `${path}/${id}`;

    updateObj[`${path}/${key}`] = updates[key];
  });

  await db.ref().update(updateObj);

  const board = await getOne(req, id, user);

  return board;
};

boards.post("/", async (req, res, next) => {
  try {
    const board = await saveBoard(req, res, req.body);

    res.json(board);
    next();
  } catch (e) {
    next(e);
  }
});

boards.get("/", async (req, res, next) => {
  try {
    const { user } = res.locals;
    const path = `users/${user.wbid}/whiteboards`;

    const resultBoards = await getObjectList(req, path, normalize);

    res.json(resultBoards);

    next();
  } catch (e) {
    next(e);
  }
});

boards.get("/:boardId", async (req, res, next) => {
  try {
    const { boardId: id } = req.params;
    const { user } = res.locals;
    const board = await getOne(req, id, user);

    res.json(board);
    next();
  } catch (e) {
    next(e);
  }
});

boards.patch("/:boardId", async (req, res, next) => {
  try {
    const board = await saveBoard(req, res, req.body);

    res.json(board);
    next();
  } catch (e) {
    next(e);
  }
});

boards.delete("/:boardId", async (req, res, next) => {
  try {
    const { boardId: id } = req.params;
    const { user } = res.locals;
    await getOne(req, id, user);

    await req.firebase.database().ref(`whiteboards/${id}`).remove();

    res.status(204).send("");

    next();
  } catch (e) {
    next(e);
  }
});

module.exports = boards;
