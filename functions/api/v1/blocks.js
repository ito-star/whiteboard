const express = require("express");
const { NotFound, BadRequest } = require("http-errors");
const _ = require("lodash");
const {
  createUUID: uuidv4,
  getBlockFilesProp,
  getBlockFiles,
} = require("../../utils");
const {
  getBlockDefaults,
  BlockTypes,
  blockTypesInfo,
  customButtonProps,
} = require("../../constant");
const { getObjectList } = require("./utils");

const blocks = express.Router();

const apiEditable = [
  "video_id",
  "rss_url",
  "sheet_url",
  "scriptEmbed",
  "iframe_url",
  "isPrivateTextBlock",
  "isTransparentTextBlock",
  "useIframely",
  "powerpoint_url",
  "webhookURL",
  "useWebhook",
  "useQAWebhook",
  "useButtonWebhook",
  "isFireMyActions",
  "pdf_path",
  "image_path",
  "imageLink",
  "color",
  "checked",
  "data",
  "qa_data",
  "qaEmailBoardOwner",
  "files",
  "buttons",
  "imageFiles",
  "pdfFiles",
  "textEditorFiles",
  "header_title",
  "type",
  "text",
  "title",
  "fileRequestSettings",
  "fileRequestFiles",
  "gridFiles",
];

const normalize = (data) => {
  const blockDefaults = getBlockDefaults();

  const normalized = {
    ...blockDefaults,
    ...data,
  };

  for (const item of normalized.data) {
    item.checked = normalized.checked.includes(item.id);
  }

  delete normalized.checked;

  const filesProp = getBlockFilesProp(normalized);
  const blockFiles = getBlockFiles(normalized);

  if (_.isPlainObject(blockFiles)) {
    const normalizedBlockFiles = Array.from(Object.values(blockFiles));
    normalized[filesProp] = normalizedBlockFiles;
  }

  return normalized;
};

const getOne = async (req, boardId, id) => {
  const snap = await req.firebase
    .database()
    .ref(`blocks/${boardId}/${id}`)
    .once("value");
  const block = snap.val();

  if (!block) {
    throw new NotFound(
      `Cannot find Block with ID "${id}" in Board with ID "${boardId}"`
    );
  }

  return normalize(block);
};

const saveBlock = async (req, res, data) => {
  const { boardId } = req.params;
  let { blockId: id } = req.params;
  const { user } = res.locals;
  const blockDefaults = getBlockDefaults();

  let prevBlock;
  let created_by = user.wbid;
  let prevType;

  const db = req.firebase.database();

  if (id) {
    prevBlock = await getOne(req, boardId, id);
    created_by = prevBlock.created_by;
    prevType = prevBlock.type;
  } else {
    id = db.ref(`blocks/${boardId}`).push().key;
  }

  let {
    pdf_path,
    image_path,
    buttons,
    textEditorFiles,
    // fileRequestFiles,
  } = data;

  const {
    webhookURL,
    video_id,
    sheet_url,
    iframe_url,
    useIframely,
    useWebhook,
    useQAWebhook,
    useButtonWebhook,
    isFireMyActions,
    rss_url,
    title: blockTitle,
    type = prevType || BlockTypes.Text,
    powerpoint_url,
    text,
    qa_data,
    qaEmailBoardOwner,
    color,
    files,
    imageFiles,
    imageLink,
    pdfFiles,
    gridFiles,
    isPrivateTextBlock,
    isTransparentTextBlock,
    data: checklistData,
    scriptEmbed,
    fileRequestSettings,
  } = data;

  const dbPath = `blocks/${boardId}/${id}`;
  const loggedInwbid = user.wbid;
  const boardMembersPath = `whiteboards/${boardId}/view_logs/${loggedInwbid}`;
  const metadataPath = `${dbPath}/metadata`;
  const boardsMetaDataPath = `whiteboards/${boardId}/metadata`;

  let bTitle = blockTitle;
  const checked = [];

  if (type === BlockTypes.QAForm) {
    if (!qa_data || !qa_data.length) {
      throw new BadRequest("Please add a question.");
    }

    const questionList = qa_data.map(({ question }) => question);
    const isQuestionDuplicated =
      new Set(questionList).size !== questionList.length;

    if (isQuestionDuplicated) {
      throw new BadRequest("Questions should be unique.");
    }

    for (const qa of qa_data) {
      if (typeof qa.id === "undefined") {
        qa.id = uuidv4();
      }
    }
  }

  if (type === BlockTypes.Checklist && Array.isArray(checklistData)) {
    for (const item of checklistData) {
      if (typeof item.id === "undefined") {
        item.id = uuidv4();
      }

      if (item.checked) {
        checked.push(item.id);
      }

      delete item.checked;
    }
  }

  if (type === BlockTypes.Buttons && Array.isArray(buttons)) {
    buttons = buttons.map((button) => {
      const buttonType = button.type || customButtonProps.Custom.type;
      const newButton = {
        id: uuidv4(),
        ...customButtonProps[buttonType],
        ...button,
      };

      if (buttonType !== customButtonProps.Custom.type) {
        newButton.color = customButtonProps[buttonType].color;
        newButton.backgroundColor =
          customButtonProps[buttonType].backgroundColor;
      }

      return newButton;
    });
  }

  if (type === BlockTypes.Iframe && !iframe_url) {
    throw new BadRequest("Please provide a URL");
  }

  if (
    type === BlockTypes.Image &&
    Array.isArray(imageFiles) &&
    imageFiles.length
  ) {
    if (imageFiles.length > 1) {
      throw new BadRequest(
        '"imageFiles" property cannot contain more than 1 file'
      );
    }

    image_path = imageFiles[0].filePath;
  }

  if (type === BlockTypes.PDF && Array.isArray(pdfFiles) && pdfFiles.length) {
    if (pdfFiles.length > 1) {
      throw new BadRequest(
        '"pdfFiles" property cannot contain more than 1 file'
      );
    }

    pdf_path = pdfFiles[0].filePath;
  }

  if (type === BlockTypes.Text) {
    if (_.isString(text)) {
      if (Array.isArray(textEditorFiles) && textEditorFiles.length) {
        textEditorFiles = textEditorFiles.filter((file) => {
          return text.includes(_.escape(file.filePath));
        });
      }
    } else if (typeof text !== "undefined") {
      textEditorFiles = [];
    }
  }

  // if (
  //   type === BlockTypes.FileRequest &&
  //   Array.isArray(fileRequestFiles) &&
  //   fileRequestFiles.length
  // ) {
  //   const filesProp = getBlockFilesProp({ type });
  //   const path = `${dbPath}/${filesProp}`;

  //   for (const file of fileRequestFiles) {
  //     if (typeof file.id === "undefined") {
  //       const ref = db.ref(path).push();
  //       const fileId = ref.key;
  //       file.id = fileId;
  //     }
  //   }

  //   fileRequestFiles = _.keyBy(fileRequestFiles, "id");
  // }

  if (typeof bTitle !== "string") {
    bTitle = "";
  } else {
    bTitle = bTitle.trim();
  }

  // This could prob be removed
  if (bTitle === "" || bTitle.toLowerCase() === "title") {
    bTitle = blockTypesInfo[type].label;
  }

  let updates = {
    isNew: false,
    id,
    board_id: boardId,
    type,
    created_by,
    color,
    title: bTitle,
  };

  if (!prevBlock) {
    updates = {
      ...blockDefaults,
      ...updates,
      date_created: new Date().toJSON(),
    };
  } else if (type !== prevType) {
    const defaults = _.pick(blockDefaults, apiEditable);
    updates = {
      ...defaults,
      ...updates,
    };
  }

  switch (true) {
    case type === BlockTypes.Conversation:
      updates = {
        ...updates,
        webhookURL,
        useWebhook,
        isFireMyActions,
      };
      break;
    case type === BlockTypes.Video:
      updates = {
        ...updates,
        video_id,
      };
      break;
    case type === BlockTypes.Spreadsheet:
      updates = {
        ...updates,
        sheet_url,
      };
      break;
    case type === BlockTypes.ScriptEmbed:
      updates = {
        ...updates,
        scriptEmbed,
      };
      break;
    case type === BlockTypes.RSS:
      updates = {
        ...updates,
        rss_url,
      };
      break;
    case type === BlockTypes.PDF:
      updates = {
        ...updates,
        pdfFiles,
        pdf_path,
        minH: 3,
        h: 3,
      };
      break;
    case type === BlockTypes.Checklist:
      updates = {
        ...updates,
        header_title: blockTitle,
        checked,
        data: checklistData,
      };
      break;
    case type === BlockTypes.Text:
      updates = {
        ...updates,
        text,
        isPrivateTextBlock,
        isTransparentTextBlock,
        minH: 1,
      };
      break;
    case type === BlockTypes.Image:
      updates = {
        ...updates,
        imageFiles,
        image_path,
        imageLink,
      };
      break;
    case type === BlockTypes.Iframe:
      updates = {
        ...updates,
        iframe_url,
        useIframely,
      };
      break;
    case type === BlockTypes.Powerpoint:
      updates = {
        ...updates,
        powerpoint_url,
      };
      break;
    case type === BlockTypes.QAForm:
      updates = {
        ...updates,
        header_title: blockTitle,
        qa_data,
        qaEmailBoardOwner,
        webhookURL,
        useQAWebhook,
      };
      break;
    case type === BlockTypes.Files:
      updates = {
        ...updates,
        header_title: blockTitle,
        files,
      };
      break;
    case type === BlockTypes.Buttons:
      updates = {
        ...updates,
        header_title: blockTitle,
        buttons,
        webhookURL,
        useButtonWebhook,
      };
      break;
    case type === BlockTypes.FileRequest:
      updates = {
        ...updates,
        fileRequestSettings,
        // fileRequestFiles,
        minH: 4,
        h: 4,
      };
      break;
    case type === BlockTypes.Grid:
      updates = {
        ...updates,
        gridFiles,
        minH: 4,
        h: 4,
      };
      break;
    default:
      // statements_def
      break;
  }

  updates = _.omitBy(updates, _.isUndefined);

  await db.ref(dbPath).update(updates);

  const currentDate = new Date().toJSON();
  const databaseUpdates = {};
  databaseUpdates[`${boardMembersPath}/lastModified`] = currentDate;
  databaseUpdates[`${metadataPath}/lastModified`] = currentDate;
  databaseUpdates[`${boardsMetaDataPath}/lastModified`] = currentDate;

  await db.ref().update(databaseUpdates);

  const block = await getOne(req, boardId, id);

  return block;
};

blocks.post("/:boardId", async (req, res, next) => {
  try {
    const block = await saveBlock(req, res, req.body);

    res.json(block);
    next();
  } catch (e) {
    next(e);
  }
});

blocks.get("/:boardId", async (req, res, next) => {
  try {
    const { boardId } = req.params;
    const path = `blocks/${boardId}`;

    const boardBlocks = await getObjectList(req, path, (id, object) => {
      return normalize(object);
    });

    res.json(boardBlocks);

    next();
  } catch (e) {
    next(e);
  }
});

blocks.get("/:boardId/:blockId", async (req, res, next) => {
  try {
    const { boardId, blockId: id } = req.params;
    const block = await getOne(req, boardId, id);

    res.json(block);
    next();
  } catch (e) {
    next(e);
  }
});

blocks.patch("/:boardId/:blockId", async (req, res, next) => {
  try {
    const block = await saveBlock(req, res, req.body);

    res.json(block);
    next();
  } catch (e) {
    next(e);
  }
});

blocks.delete("/:boardId/:blockId", async (req, res, next) => {
  try {
    const { boardId, blockId: id } = req.params;
    await getOne(req, boardId, id);

    await req.firebase.database().ref(`blocks/${boardId}/${id}`).remove();

    res.status(204).send("");
    next();
  } catch (e) {
    next(e);
  }
});

module.exports = blocks;
