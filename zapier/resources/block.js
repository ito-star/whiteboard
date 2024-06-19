const _ = require("lodash");
const config = require("../config");
const { makeColorChoices, blockColors } = require("./utils");

const BlockTypes = {
  Text: "Text",
  PDF: "PDF",
  Files: "Files",
  Video: "Video",
  Iframe: "Iframe",
  Image: "Image",
  RSS: "RSS",
  Conversation: "Conversation",
  Checklist: "Checklist",
  Powerpoint: "Powerpoint",
  Spreadsheet: "Spreadsheet",
  ScriptEmbed: "ScriptEmbed",
  QAForm: "QAForm",
  Buttons: "Buttons",
  FileRequest: "FileRequest",
  Grid: "Grid",
};

const blockTypesInfo = {
  [BlockTypes.Text]: {
    type: BlockTypes.Text,
    label: "Text",
    dataPath: "text",
  },
  [BlockTypes.PDF]: {
    type: BlockTypes.PDF,
    label: "PDF",
    dataPath: "pdf_path",
  },
  [BlockTypes.Files]: {
    type: BlockTypes.Files,
    label: "File Storage",
    dataPath: "files",
  },
  [BlockTypes.Video]: {
    type: BlockTypes.Video,
    label: "Video",
    dataPath: "video_id",
  },
  [BlockTypes.Iframe]: {
    type: BlockTypes.Iframe,
    label: "Embed Web Page",
    dataPath: "iframe_url",
  },
  [BlockTypes.Image]: {
    type: BlockTypes.Image,
    label: "Image",
    dataPath: "image_path",
  },
  [BlockTypes.RSS]: {
    type: BlockTypes.RSS,
    label: "RSS Feed",
    dataPath: "rss_url",
  },
  [BlockTypes.Conversation]: {
    type: BlockTypes.Conversation,
    label: "Chat",
    dataPath: "conversation",
  },
  [BlockTypes.Checklist]: {
    type: BlockTypes.Checklist,
    label: "Checklist",
    dataPath: "data",
  },
  [BlockTypes.Powerpoint]: {
    type: BlockTypes.Powerpoint,
    label: "MSFT Powerpoint",
    dataPath: "powerpoint_url",
  },
  [BlockTypes.Spreadsheet]: {
    type: BlockTypes.Spreadsheet,
    label: "Google Spreadsheet",
    dataPath: "sheet_url",
  },
  [BlockTypes.ScriptEmbed]: {
    type: BlockTypes.ScriptEmbed,
    label: "Embed HTML",
    dataPath: "scriptEmbed",
  },
  [BlockTypes.QAForm]: {
    type: BlockTypes.QAForm,
    label: "Q & A Form",
    dataPath: "qa_data",
  },
  [BlockTypes.Buttons]: {
    type: BlockTypes.Buttons,
    label: "Buttons",
    dataPath: "buttons",
  },
  [BlockTypes.FileRequest]: {
    type: BlockTypes.FileRequest,
    label: "File Request",
    dataPath: "fileRequestFiles",
  },
  [BlockTypes.Grid]: {
    type: BlockTypes.Grid,
    label: "Excel / CSV Viewer",
    dataPath: "gridFiles",
  },
};

const blockTypeOrder = [
  BlockTypes.Text,
  BlockTypes.PDF,
  BlockTypes.Image,
  BlockTypes.Video,
  // BlockTypes.Files,
  BlockTypes.Buttons,
  BlockTypes.Checklist,
  BlockTypes.Conversation,
  BlockTypes.ScriptEmbed,
  BlockTypes.Iframe,
  BlockTypes.FileRequest,
  BlockTypes.QAForm,
  BlockTypes.RSS,
  // BlockTypes.Grid,
];

const fileChildren = [
  {
    key: "id",
    label: "File ID",
    type: "string",
  },
  {
    key: "createdBy",
    label: "Created By",
    type: "string",
  },
  {
    key: "fileName",
    label: "File Name",
    type: "string",
  },
  {
    key: "filePath",
    label: "File URL",
    type: "string",
  },
  {
    key: "fileSize",
    label: "File Size",
    type: "integer",
    helpText: "In Bytes",
  },
  {
    key: "fileType",
    label: "MIME Type",
    type: "string",
  },
  {
    key: "storagePath",
    label: "Storage Path",
    type: "string",
  },
  {
    key: "uploadDate",
    label: "Upload Date",
    type: "datetime",
  },
  {
    key: "usage",
    label: "File Usage",
    dict: true,
  },
];

const colorChoices = makeColorChoices(blockColors);

const fields = {
  id: {
    key: "id",
    label: "Block ID",
    type: "string",
  },
  board_id: {
    key: "board_id",
    label: "Board ID",
    type: "string",
  },
  created_by: {
    key: "created_by",
    label: "Created By",
    type: "string",
  },
  date_created: {
    key: "date_created",
    label: "Date Created",
    type: "datetime",
  },
  video_id: {
    key: "video_id",
    label: "Video ID",
    type: "string",
  },
  rss_url: {
    key: "rss_url",
    label: `${blockTypesInfo.RSS.label} URL`,
    type: "string",
  },
  sheet_url: {
    key: "sheet_url",
    label: `${blockTypesInfo.Spreadsheet.label} URL`,
    type: "string",
  },
  scriptEmbed: {
    key: "scriptEmbed",
    label: "Script Embed Code",
    type: "text",
  },
  iframe_url: {
    key: "iframe_url",
    label: `${blockTypesInfo.Iframe.label} URL`,
    type: "string",
  },
  isPrivateTextBlock: {
    key: "isPrivateTextBlock",
    label: "Make Private",
    type: "boolean",
  },
  isTransparentTextBlock: {
    key: "isTransparentTextBlock",
    label: "Transparent Background",
    type: "boolean",
  },
  useIframely: {
    key: "useIframely",
    label: "Use Iframely",
    helpText: "Ideal for Twitter, Facebook & hard-to-embed sites",
    type: "boolean",
  },
  powerpoint_url: {
    key: "powerpoint_url",
    label: `${blockTypesInfo.Powerpoint.label} URL`,
    type: "string",
  },
  webhookURL: {
    key: "webhookURL",
    label: "Webhook URL",
    type: "string",
  },
  useButtonWebhook: {
    key: "useButtonWebhook",
    label: "Use Webhook",
    type: "boolean",
  },
  pdf_path: {
    key: "pdf_path",
    label: `${blockTypesInfo.PDF.label} URL`,
    type: "string",
    helpText:
      "File uploads (if your plan allows them) through Zapier are not supported at this time",
  },
  image_path: {
    key: "image_path",
    label: `${blockTypesInfo.Image.label} URL`,
    type: "string",
    helpText:
      "File uploads (if your plan allows them) through Zapier are not supported at this time",
  },
  imageLink: {
    key: "imageLink",
    label:
      "When the image is clicked on, this web page will be opened in a new browser window/tab.",
    type: "string",
  },
  color: {
    key: "color",
    label: "Color",
    type: "string",
    choices: colorChoices,
  },
  data: {
    key: "data",
    label: `${blockTypesInfo.Checklist.label} Items`,
    list: true,
    children: [
      {
        key: "text",
        label: "Text",
        type: "string",
        required: true,
      },
      {
        key: "description",
        label: "Description",
        type: "string",
      },
      {
        key: "checked",
        label: "Checked",
        type: "boolean",
      },
    ],
  },
  qa_data: {
    key: "qa_data",
    label: `${blockTypesInfo.QAForm.label} Items`,
    list: true,
    children: [
      {
        key: "question",
        label: "Question",
        type: "string",
        required: true,
      },
      {
        key: "answer",
        label: "Answer",
        type: "text",
      },
    ],
  },
  qaEmailBoardOwner: {
    key: "qaEmailBoardOwner",
    label: "Email Results to Board Owner",
    type: "boolean",
  },
  files: {
    key: "files",
    label: "Files",
    list: true,
    children: fileChildren,
  },
  gridFiles: {
    key: "gridFiles",
    label: "Excel / CSV Files",
    list: true,
    children: fileChildren,
  },
  buttons: {
    key: "buttons",
    label: "Buttons",
    list: true,
    children: [
      {
        key: "type",
        label: "Button Type",
        type: "string",
        required: true,
        choices: [
          {
            label: "Custom",
            value: "Custom",
            sample: "Custom",
          },
          {
            label: "Twitter",
            value: "Twitter",
            sample: "Twitter",
          },
          {
            label: "Facebook",
            value: "Facebook",
            sample: "Facebook",
          },
          {
            label: "Youtube",
            value: "Youtube",
            sample: "Youtube",
          },
          {
            label: "LinkedIn",
            value: "LinkedIn",
            sample: "LinkedIn",
          },
        ],
      },
      {
        key: "text",
        label: "Text",
        type: "string",
      },
      {
        key: "url",
        label: "URL",
        type: "string",
      },
      {
        key: "color",
        label: "Color",
        type: "string",
      },
      {
        key: "backgroundColor",
        label: "Background Color",
        type: "string",
      },
    ],
  },
  imageFiles: {
    key: "imageFiles",
    label: "Image Files",
    list: true,
    children: fileChildren,
  },
  pdfFiles: {
    key: "pdfFiles",
    label: "PDF Files",
    list: true,
    children: fileChildren,
  },
  textEditorFiles: {
    key: "textEditorFiles",
    label: "Text Editor Files",
    list: true,
    children: fileChildren,
  },
  // eslint-disable-next-line camelcase
  fileRequestSettings__note: {
    key: "fileRequestSettings__note",
    label: "Description",
    type: "text",
    helpText: "A short, helpful description of the file(s) you are requesting",
  },
  fileRequestFiles: {
    key: "fileRequestFiles",
    label: "File Request Files",
    list: true,
    children: fileChildren,
  },
  header_title: {
    key: "header_title",
    label: "Checklist Title",
    type: "string",
  },
  type: {
    key: "type",
    label: "Type",
    type: "string",
    choices: Object.values(blockTypesInfo)
      .map((info) => {
        return {
          label: info.label,
          value: info.type,
          sample: info.type,
        };
      })
      .filter((choice) => blockTypeOrder.includes(choice.value))
      .sort((choiceA, choiceB) => {
        const indexA = blockTypeOrder.indexOf(choiceA.value);
        const indexB = blockTypeOrder.indexOf(choiceB.value);

        return indexA - indexB;
      }),
  },
  text: {
    key: "text",
    label: "Text",
    type: "text",
  },
  title: {
    key: "title",
    label: "Title",
    type: "string",
  },
};

const blockGlobalFieldsFactory = (action) => {
  return [
    {
      ...fields.board_id,
      required: true,
      dynamic: "boardList.id.board_name",
      search: "boardSearch.id",
    },
    action === "update" && {
      ...fields.id,
      required: true,
      dynamic: "blockList.id.title",
      search: "blockSearch.id",
    },
    { ...fields.title },
    { ...fields.color },
  ].filter(Boolean);
};

const blockTypeFieldFactory = () => {
  return async (z) => {
    const allowedBlockTypes = (
      await z.request(`${config.WHATBOARD_URL}/zapier-getAllowedBlockTypes`)
    ).data;

    const blockTypeField = { ...fields.type, altersDynamicFields: true };

    blockTypeField.choices = blockTypeField.choices.filter((choice) => {
      return allowedBlockTypes.includes(choice.value);
    });

    return [blockTypeField];
  };
};

const convertFieldChildrenForInputFields = (children, parentProp) => {
  const newChildren = (children || []).map((child) => {
    return {
      ...child,
      key: `${parentProp}[]${child.key}`,
    };
  });

  return newChildren;
};

const convertInputChildrenToData = (children, parentProp) => {
  const newChildren = (children || []).map((child) => {
    const newChild = _.mapKeys(child, (value, key) => {
      return key.replace(`${parentProp}[]`, "");
    });

    return newChild;
  });

  return newChildren;
};

const convertNestedFieldsToData = (inputData, field) => {
  const keyPrefix = `${field}__`;
  const keyPrefixExpr = new RegExp(`^${keyPrefix}`);
  const pathVals = {};

  for (const [key, value] of Object.entries(inputData)) {
    if (key.startsWith(`${field}__`)) {
      const path = key.replace(keyPrefixExpr, "").replace("__", ".");
      pathVals[path] = value;
    }
  }

  const newData = {};

  for (const [path, value] of Object.entries(pathVals)) {
    _.set(newData, path, value);
  }

  return newData;
};

const blockTypeFieldsFactory = (action) => {
  return (z, bundle) => {
    let typeFields = [];
    const { type } = bundle.inputData;

    const updateModeField = {
      key: "updateMode",
      label: "Update Mode",
      choices: [
        {
          label: "Replace",
          value: "replace",
          sample: "replace",
        },
        {
          label: "Merge",
          value: "merge",
          sample: "merge",
        },
      ],
      default: "replace",
      helpText:
        "Replace Mode: Replace the list items entirely with those from the input.\nMerge Mode: Merge the input into the existing list items. Input items with IDs will update the corresponding existing item. Input items without IDs will be appended to the list.",
    };

    switch (true) {
      case type === BlockTypes.Conversation:
        break;
      case type === BlockTypes.Video:
        typeFields = [{ ...fields.video_id }];
        break;
      case type === BlockTypes.Spreadsheet:
        typeFields = [{ ...fields.sheet_url }];
        break;
      case type === BlockTypes.ScriptEmbed:
        typeFields = [{ ...fields.scriptEmbed }];
        break;
      case type === BlockTypes.RSS:
        typeFields = [{ ...fields.rss_url }];
        break;
      case type === BlockTypes.PDF:
        typeFields = [{ ...fields.pdf_path }];
        break;
      case type === BlockTypes.Checklist: {
        const dataFields = {
          ...fields.data,
        };

        if (action === "update") {
          dataFields.children.unshift({
            key: "dataId",
            label: "ID",
            type: "string",
          });
        }

        typeFields = [dataFields];

        if (action === "update") {
          typeFields = [updateModeField, dataFields];
        }

        break;
      }
      case type === BlockTypes.Text:
        typeFields = [
          { ...fields.isPrivateTextBlock },
          { ...fields.isTransparentTextBlock },
          { ...fields.text },
        ];
        break;
      case type === BlockTypes.Image:
        typeFields = [{ ...fields.image_path }, { ...fields.imageLink }];
        break;
      case type === BlockTypes.Iframe:
        typeFields = [{ ...fields.iframe_url }, { ...fields.useIframely }];
        break;
      case type === BlockTypes.Powerpoint:
        typeFields = [{ ...fields.powerpoint_url }];
        break;
      case type === BlockTypes.QAForm: {
        const qaFields = {
          ...fields.qa_data,
        };

        if (action === "update") {
          qaFields.children.unshift({
            key: "qaId",
            label: "ID",
            type: "string",
          });
        }

        typeFields = [fields.qaEmailBoardOwner, qaFields];

        if (action === "update") {
          typeFields.unshift(updateModeField);
        }

        break;
      }
      case type === BlockTypes.Files:
        typeFields = [{ ...fields.files }];
        break;
      case type === BlockTypes.Buttons: {
        const buttonsFields = {
          ...fields.buttons,
        };

        if (action === "update") {
          buttonsFields.children.unshift({
            key: "id",
            label: "ID",
            type: "string",
          });
        }

        buttonsFields.children = convertFieldChildrenForInputFields(
          buttonsFields.children,
          "buttons"
        );

        typeFields = [
          fields.useButtonWebhook,
          fields.webhookURL,
          buttonsFields,
        ];

        if (action === "update") {
          typeFields.unshift(updateModeField);
        }

        break;
      }
      case type === BlockTypes.FileRequest:
        typeFields = [fields.fileRequestSettings__note];
        break;
      case type === BlockTypes.Grid:
        typeFields = [{ ...fields.gridFiles }];
        break;
      default:
        // statements_def
        break;
    }

    return typeFields;
  };
};

const resource = {
  key: "block",
  noun: "Block",

  get: {
    display: {
      label: "Get a Block from a Board",
      description: "Get a Block by its ID from a Board by its ID",
    },
    operation: {
      inputFields: [
        { ...fields.board_id, required: true },
        { ...fields.id, required: true },
      ],
      perform: async (z, bundle) => {
        const response = await z.request({
          url: `${config.WHATBOARD_API_URL}/blocks/${bundle.inputData.board_id}/${bundle.inputData.id}`,
        });

        return response.data;
      },
    },
  },

  list: {
    display: {
      label: "List Blocks",
      hidden: true,
    },
    operation: {
      canPaginate: true,
      inputFields: [{ ...fields.board_id, required: true }],
      perform: async (z, bundle) => {
        let cursor;

        if (bundle.meta.page) {
          cursor = await z.cursor.get();
        }

        const response = await z.request({
          url: `${config.WHATBOARD_API_URL}/blocks/${bundle.inputData.board_id}`,
          params: {
            dir: "desc",
            pageToken: cursor,
          },
        });

        const { result, nextPageToken } = response.data;

        if (nextPageToken) {
          await z.cursor.set(nextPageToken);
        }

        return result;
      },
    },
  },

  create: {
    display: {
      label: "Create Block",
      description: "Creates a new Block",
      important: true,
    },
    operation: {
      inputFields: [
        ...blockGlobalFieldsFactory("create"),
        blockTypeFieldFactory(),
        blockTypeFieldsFactory("create"),
      ],
      perform: async (z, bundle) => {
        const newBlock = {
          ...bundle.inputData,
        };

        if (newBlock.type === BlockTypes.Buttons) {
          newBlock.buttons = convertInputChildrenToData(
            newBlock.buttons,
            "buttons"
          );
        }

        if (newBlock.type === BlockTypes.FileRequest) {
          delete newBlock.fileRequestSettings__note;
          newBlock.fileRequestSettings = convertNestedFieldsToData(
            bundle.inputData,
            "fileRequestSettings"
          );
        }

        const block = (
          await z.request({
            method: "POST",
            url: `${config.WHATBOARD_API_URL}/blocks/${bundle.inputData.board_id}`,
            json: newBlock,
          })
        ).data;

        return block;
      },
    },
  },

  search: {
    display: {
      label: "Find a Block by Name",
      description:
        "Search for a Block whose name matches exactly with the one specified. The first match returned will be used.",
      important: true,
    },
    operation: {
      inputFields: [
        {
          ...fields.board_id,
          dynamic: "boardList.id.board_name",
          search: "boardSearch.id",
          required: true,
        },
        { ...fields.title, required: true },
      ],
      perform: async (z, bundle) => {
        const response = await z.request({
          url: `${config.WHATBOARD_API_URL}/blocks/${bundle.inputData.board_id}`,
          params: {
            orderBy: "title",
            equalTo: bundle.inputData.title,
          },
        });

        return response.data.result;
      },
    },
  },

  sample: {
    id: "",
    board_id: "",
    created_by: "",
    video_id: "",
    rss_url: "",
    sheet_url: "",
    iframe_url: "",
    useIframely: false,
    powerpoint_url: "",
    pdf_path: "",
    image_path: "",
    checked: [],
    data: [
      {
        text: "First Item",
        id: "00000000-0000-0000-0000-000000000000",
        checked: false,
      },
      {
        text: "Second Item",
        id: "11111111-1111-1111-1111-111111111111",
        checked: false,
      },
    ],
    qa_data: [
      {
        question: "Add a question",
        answer: "",
        id: "00000000-0000-0000-0000-000000000000",
      },
    ],
    files: [],
    gridFiles: [],
    imageFiles: [],
    pdfFiles: [],
    header_title: "Checklist",
    type: BlockTypes.Text,
    text: "",
    title: "Title",
  },

  outputFields: Object.values(fields),
};

module.exports = {
  Block: resource,
  fields,
  BlockTypes,
  blockTypesInfo,
  blockGlobalFieldsFactory,
  blockTypeFieldFactory,
  blockTypeFieldsFactory,
  convertFieldChildrenForInputFields,
  convertInputChildrenToData,
  convertNestedFieldsToData,
};
