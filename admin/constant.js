const { v4: uuidv4 } = require("uuid");

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

exports.BlockTypes = BlockTypes;

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

exports.blockTypesInfo = blockTypesInfo;

const dataPathPerType = {
  [BlockTypes.Text]: blockTypesInfo.Text.dataPath,
  [BlockTypes.PDF]: blockTypesInfo.PDF.dataPath,
  [BlockTypes.Files]: blockTypesInfo.Files.dataPath,
  [BlockTypes.Video]: blockTypesInfo.Video.dataPath,
  [BlockTypes.Iframe]: blockTypesInfo.Iframe.dataPath,
  [BlockTypes.Image]: blockTypesInfo.Image.dataPath,
  [BlockTypes.RSS]: blockTypesInfo.RSS.dataPath,
  [BlockTypes.Conversation]: blockTypesInfo.Conversation.dataPath,
  [BlockTypes.Checklist]: blockTypesInfo.Checklist.dataPath,
  [BlockTypes.Powerpoint]: blockTypesInfo.Powerpoint.dataPath,
  [BlockTypes.Spreadsheet]: blockTypesInfo.Spreadsheet.dataPath,
  [BlockTypes.ScriptEmbed]: blockTypesInfo.ScriptEmbed.dataPath,
  [BlockTypes.QAForm]: blockTypesInfo.QAForm.dataPath,
  [BlockTypes.Buttons]: blockTypesInfo.Buttons.dataPath,
  [BlockTypes.FileRequest]: blockTypesInfo.FileRequest.dataPath,
  [BlockTypes.Grid]: blockTypesInfo.Grid.dataPath,
};

exports.dataPathPerType = dataPathPerType;

const customButtonType = {
  Custom: "Custom",
  Twitter: "Twitter",
  Facebook: "Facebook",
  Youtube: "Youtube",
  LinkedIn: "LinkedIn",
};

exports.customButtonType = customButtonType;

const customButtonProps = {
  Custom: {
    color: "#ffffff",
    backgroundColor: "#2972a9",
    text: "Click here to change",
    url: "",
    type: customButtonType.Custom,
  },
  Twitter: {
    color: "#ffffff",
    backgroundColor: "#5cb1e9",
    text: "Follow me",
    url: "https://twitter.com/",
    type: customButtonType.Twitter,
  },
  Facebook: {
    color: "#ffffff",
    backgroundColor: "#3b5a92",
    text: "Find me on Facebook",
    url: "https://www.facebook.com/",
    type: customButtonType.Facebook,
  },
  Youtube: {
    color: "#ffffff",
    backgroundColor: "#c90022",
    text: "Watch me on Youtube",
    url: "https://www.youtube.com/",
    type: customButtonType.Youtube,
  },
  LinkedIn: {
    color: "#ffffff",
    backgroundColor: "#1979ae",
    text: "Let's connect!",
    url: "https://www.linkedin.com/",
    type: customButtonType.LinkedIn,
  },
};

exports.customButtonProps = customButtonProps;

const getBlockDefaults = () => {
  const blockDefaults = {
    isNew: false,
    id: "",
    board_id: "",
    conversation: [],
    static: false,
    created_by: "",
    video_id: "",
    rss_url: "",
    sheet_url: "",
    scriptEmbed: "",
    iframe_url: "",
    isPrivateTextBlock: false,
    isTransparentTextBlock: false,
    useIframely: false,
    powerpoint_url: "",
    webhookURL: "",
    useWebhook: false,
    useQAWebhook: false,
    useButtonWebhook: false,
    isFireMyActions: false,
    pdf_path: "",
    image_path: "",
    imageLink: "",
    color: "#ffffff",
    checked: [],
    data: [
      { text: "First Item", id: uuidv4() },
      { text: "Second Item", id: uuidv4() },
    ],
    qa_data: [{ question: "", answer: "", id: uuidv4() }],
    qaEmailBoardOwner: true,
    files: [],
    gridFiles: [],
    buttons: [{ id: uuidv4(), ...customButtonProps.Custom }],
    imageFiles: [],
    pdfFiles: [],
    textEditorFiles: [],
    fileRequestFiles: {},
    fileRequestSettings: {
      note: "",
    },
    header_title: "Checklist",
    type: BlockTypes.Text,
    text: "",
    title: "Title",
    x: 0,
    y: 0,
    w: 2,
    minH: 1,
    h: 2,
    minW: 1,
  };

  return blockDefaults;
};

exports.getBlockDefaults = getBlockDefaults;
