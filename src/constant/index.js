import React from "react";
import hexToRgba from "hex-to-rgba";
import { v4 as uuidv4 } from "uuid";
import _without from "lodash/without";
import TextFieldIcon from "@material-ui/icons/TextFields";
import PictureAsPdfIcon from "@material-ui/icons/PictureAsPdfOutlined";
import ImageIcon from "@material-ui/icons/ImageOutlined";
import VideoLibraryIcon from "@material-ui/icons/VideoLibraryOutlined";
import FileUploadIcon from "@material-ui/icons/AttachFileOutlined";
import CheckBoxIcon from "@material-ui/icons/CheckBoxOutlined";
import RssFeedIcon from "@material-ui/icons/RssFeedOutlined";
import QuestionAnswerIcon from "@material-ui/icons/QuestionAnswerOutlined";
import ChatBubbleIcon from "@material-ui/icons/ChatBubbleOutlined";
import HtmlIcon from "../components/icons/Html";
import IntegrationInstructionsIcon from "../components/icons/IntegrationInstructions";
import SmartButtonIcon from "../components/icons/SmartButtonOutlined";
import FileOpenIcon from "../components/icons/FileOpenOutlined";

export const ThemeColors = {
  BLUE: "#2c387e",
  LIGHTBLUE: "#0f8df0",
  YELLOW: "#ffc106",
  ORANGE: "#f67c09",
  RED: "#dc143c",
  SCARLET: "#FF2400",
  PINK: "#F4869C",
  BEIGE: "#FCEAB4",
  GREEN: "#55C57C",
  DARKGREEN: "#0da00b",
  BROWN: "#795548",
  GREY: "#4B4B4B",
  PURPLE: "#a043bc",
  DARKBLUE: "#051225",
  DARKGREY: "#1f1f1f",
  BLACK: "#000000",
  LIGHTGREY: "#F1F1F1",
  NOCOLOR: "#ffffff00",
  WHITE: "#ffffff",
};

export const isLightBodyColor = (bodyColor) => {
  return (
    bodyColor === ThemeColors.WHITE ||
    bodyColor === ThemeColors.NOCOLOR ||
    bodyColor === ThemeColors.LIGHTGREY ||
    bodyColor === ThemeColors.BEIGE
  );
};

export const ThemeColorLabels = {
  DARKBLUE: "Dark Blue",
  BLUE: "Blue",
  SCARLET: "Scarlet",
  LIGHTBLUE: "Light Blue",
  YELLOW: "Yellow",
  ORANGE: "Orange",
  RED: "Red",
  PINK: "Pink",
  DARKGREEN: "Dark Green",
  BEIGE: "Beige",
  GREEN: "Green",
  BROWN: "Brown",
  GREY: "Grey",
  BLACK: "Black",
  DARKGREY: "Dark Grey",
  PURPLE: "Purple",
  LIGHTGREY: "Light Grey",
  NOCOLOR: "Transparent",
  WHITE: "White",
};

Object.entries(ThemeColors).forEach(([key, value]) => {
  ThemeColorLabels[value] = ThemeColorLabels[key];
});

export const boardColors = [
  ThemeColors.RED,
  ThemeColors.SCARLET,
  ThemeColors.ORANGE,
  ThemeColors.YELLOW,
  ThemeColors.GREEN,
  ThemeColors.DARKGREEN,
  ThemeColors.LIGHTBLUE,
  ThemeColors.BLUE,
  ThemeColors.DARKBLUE,
  ThemeColors.PURPLE,
  ThemeColors.PINK,
  ThemeColors.BEIGE,
  ThemeColors.BROWN,
  ThemeColors.GREY,
  ThemeColors.DARKGREY,
  ThemeColors.BLACK,
  ThemeColors.LIGHTGREY,
  ThemeColors.NOCOLOR,
  ThemeColors.WHITE,
];

export const blockColors = _without(boardColors, ThemeColors.NOCOLOR);

export const RssRefreshTimer = 300000; // 5 Minutes in milliseconds

export const minDeviceWidth = 768;

export const BlockTypes = {
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

export const blockTypesInfo = {
  [BlockTypes.Text]: {
    type: BlockTypes.Text,
    label: "Text",
    dataPath: "text",
    color: hexToRgba(ThemeColors.BLUE, 1.0),
    icon: <TextFieldIcon />,
  },
  [BlockTypes.PDF]: {
    type: BlockTypes.PDF,
    label: "PDF",
    dataPath: "pdf_path",
    color: hexToRgba(ThemeColors.BLUE, 0.75),
    icon: <PictureAsPdfIcon />,
    guide:
      "Enter a URL to your file to embed the file in this block or you may upload your file from your device to embed in this block.",
  },
  [BlockTypes.Files]: {
    type: BlockTypes.Files,
    label: "File Storage",
    dataPath: "files",
    color: hexToRgba(ThemeColors.GREY, 0.25),
    icon: <FileUploadIcon />,
    guide:
      "Add a file or groups of files by dragging and dropping files on 'Drop files here, paste or browse files' area. Be sure to click 'upload'",
  },
  [BlockTypes.Video]: {
    type: BlockTypes.Video,
    label: "Video",
    dataPath: "video_id",
    color: hexToRgba(ThemeColors.GREY, 0.5),
    icon: <VideoLibraryIcon />,
    guide:
      "Free and paid users: enter a URL to your video file to embed the viceo in this block. Youtube and Vimeo links only.",
  },
  [BlockTypes.Iframe]: {
    type: BlockTypes.Iframe,
    label: "Embed Web Page",
    dataPath: "iframe_url",
    color: hexToRgba(ThemeColors.BROWN, 0.5),
    icon: <IntegrationInstructionsIcon />,
    guide:
      "You can input a website URL in the 'Web Page URL' field. Check 'Iframely' if the URL doesn't appear correctly, or if you are embedding Twitter or Instagram. Even interactive sites like Airtable, Google Forms, Redash and others should render properly.",
  },
  [BlockTypes.Image]: {
    type: BlockTypes.Image,
    label: "Image",
    dataPath: "image_path",
    color: hexToRgba(ThemeColors.GREY, 0.75),
    icon: <ImageIcon />,
    guide:
      "Enter a URL to your file to embed the file in this block or you may upload your file from your device to embed in this block.",
  },
  [BlockTypes.RSS]: {
    type: BlockTypes.RSS,
    label: "RSS Feed",
    dataPath: "rss_url",
    color: hexToRgba(ThemeColors.BROWN, 0.75),
    icon: <RssFeedIcon />,
    guide: "Enter a RSS Feed URL to embed the RSS feed in this block.",
  },
  [BlockTypes.Conversation]: {
    type: BlockTypes.Conversation,
    label: "Chat",
    dataPath: "conversation",
    color: hexToRgba(ThemeColors.BROWN, 1.0),
    icon: <ChatBubbleIcon />,
    guide:
      "This block creates a live chat you can use to comment on your board, or to exchange comments with other invited users.",
  },
  [BlockTypes.Checklist]: {
    type: BlockTypes.Checklist,
    label: "Checklist",
    dataPath: "data",
    color: hexToRgba(ThemeColors.GREY, 1.0),
    icon: <CheckBoxIcon />,
    guide:
      "Click (+) to add a new checklist item, or a bookmark. Full URLs will render as active web links.",
  },
  [BlockTypes.Powerpoint]: {
    type: BlockTypes.Powerpoint,
    label: "MSFT Powerpoint",
    dataPath: "powerpoint_url",
    color: hexToRgba(ThemeColors.BLUE, 0.25),
    icon: <FileUploadIcon />,
  },
  [BlockTypes.Spreadsheet]: {
    type: BlockTypes.Spreadsheet,
    label: "Google Spreadsheet",
    dataPath: "sheet_url",
    color: hexToRgba(ThemeColors.BLUE, 0.5),
    icon: <FileUploadIcon />,
    guide:
      "Enter a URL to your Google Sheet to embed the sheet in this block. Be certain to share/publish your sheet before embedding. You can restrict access to the sheet using Google Sheet's share restrictions options.",
  },
  [BlockTypes.ScriptEmbed]: {
    type: BlockTypes.ScriptEmbed,
    label: "Embed HTML",
    dataPath: "scriptEmbed",
    color: hexToRgba(ThemeColors.BLACK, 0.25),
    icon: <HtmlIcon />,
    guide: "Enter or Paste script embed snippet to embed HTML in this block.",
  },
  [BlockTypes.QAForm]: {
    type: BlockTypes.QAForm,
    label: "Q & A Form",
    dataPath: "qa_data",
    color: hexToRgba(ThemeColors.BROWN, 0.25),
    icon: <QuestionAnswerIcon />,
    guide:
      "Use this form to create a Q&A form to obtain information from your clients.",
  },
  [BlockTypes.Buttons]: {
    type: BlockTypes.Buttons,
    label: "Buttons",
    dataPath: "buttons",
    color: hexToRgba(ThemeColors.BLACK, 0.5),
    icon: <SmartButtonIcon />,
  },
  [BlockTypes.FileRequest]: {
    type: BlockTypes.FileRequest,
    label: "File Request",
    dataPath: "fileRequestFiles",
    color: hexToRgba(ThemeColors.BLACK, 1.0),
    icon: <FileOpenIcon />,
    guide:
      "This block allow you to request files from other invited users. If this board is publicly accessible, then anyone with access to this board can upload a file to this block. All files uploaded to this block count against your own storage usage.",
  },
  [BlockTypes.Grid]: {
    type: BlockTypes.Grid,
    label: "Excel / CSV Viewer",
    dataPath: "gridFiles",
    color: hexToRgba(ThemeColors.BLACK, 0.5),
    guide:
      "View and Edit spreadsheets via Grids. Upload a CSV or start an empty Grid.",
  },
};

export const blockTypeLabels = {
  [BlockTypes.Text]: blockTypesInfo.Text.label,
  [BlockTypes.PDF]: blockTypesInfo.PDF.label,
  [BlockTypes.Files]: blockTypesInfo.Files.label,
  [BlockTypes.Video]: blockTypesInfo.Video.label,
  [BlockTypes.Iframe]: blockTypesInfo.Iframe.label,
  [BlockTypes.Image]: blockTypesInfo.Image.label,
  [BlockTypes.RSS]: blockTypesInfo.RSS.label,
  [BlockTypes.Conversation]: blockTypesInfo.Conversation.label,
  [BlockTypes.Checklist]: blockTypesInfo.Checklist.label,
  [BlockTypes.Powerpoint]: blockTypesInfo.Powerpoint.label,
  [BlockTypes.Spreadsheet]: blockTypesInfo.Spreadsheet.label,
  [BlockTypes.ScriptEmbed]: blockTypesInfo.ScriptEmbed.label,
  [BlockTypes.QAForm]: blockTypesInfo.QAForm.label,
  [BlockTypes.Buttons]: blockTypesInfo.Buttons.label,
  [BlockTypes.FileRequest]: blockTypesInfo.FileRequest.label,
  [BlockTypes.Grid]: blockTypesInfo.Grid.label,
};

export const dataPathPerType = {
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

export const blockTypeColors = {
  [BlockTypes.Text]: blockTypesInfo.Text.color,
  [BlockTypes.PDF]: blockTypesInfo.PDF.color,
  [BlockTypes.Files]: blockTypesInfo.Files.color,
  [BlockTypes.Video]: blockTypesInfo.Video.color,
  [BlockTypes.Iframe]: blockTypesInfo.Iframe.color,
  [BlockTypes.Image]: blockTypesInfo.Image.color,
  [BlockTypes.RSS]: blockTypesInfo.RSS.color,
  [BlockTypes.Conversation]: blockTypesInfo.Conversation.color,
  [BlockTypes.Checklist]: blockTypesInfo.Checklist.color,
  [BlockTypes.Powerpoint]: blockTypesInfo.Powerpoint.color,
  [BlockTypes.Spreadsheet]: blockTypesInfo.Spreadsheet.color,
  [BlockTypes.ScriptEmbed]: blockTypesInfo.ScriptEmbed.color,
  [BlockTypes.QAForm]: blockTypesInfo.QAForm.color,
  [BlockTypes.Buttons]: blockTypesInfo.Buttons.color,
  [BlockTypes.FileRequest]: blockTypesInfo.FileRequest.color,
  [BlockTypes.Grid]: blockTypesInfo.Grid.color,
};

export const customButtonType = {
  Custom: "Custom",
  Twitter: "Twitter",
  Facebook: "Facebook",
  Youtube: "Youtube",
  LinkedIn: "LinkedIn",
};

export const customButtonProps = {
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

export const getBlockDefaults = () => {
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

export const ReportReasons = [
  "Sexual Content",
  "Violent or repulsive content",
  "Hateful or abusive content",
  "Harmful or dangerous acts",
  "Spam or misleading",
  "Publishing copyrighted content without permission of rights holder",
];

export const supportFormSubjects = [
  "Report A Bug",
  "Technical Support",
  "Billing/Account Issues",
  "Other Inquiries",
];

export const blockTypeGuides = {
  [BlockTypes.Text]: blockTypesInfo.Text.guide,
  [BlockTypes.PDF]: blockTypesInfo.PDF.guide,
  [BlockTypes.Files]: blockTypesInfo.Files.guide,
  [BlockTypes.Video]: blockTypesInfo.Video.guide,
  [BlockTypes.Iframe]: blockTypesInfo.Iframe.guide,
  [BlockTypes.Image]: blockTypesInfo.Image.guide,
  [BlockTypes.RSS]: blockTypesInfo.RSS.guide,
  [BlockTypes.Conversation]: blockTypesInfo.Conversation.guide,
  [BlockTypes.Checklist]: blockTypesInfo.Checklist.guide,
  [BlockTypes.Powerpoint]: blockTypesInfo.Powerpoint.guide,
  [BlockTypes.Spreadsheet]: blockTypesInfo.Spreadsheet.guide,
  [BlockTypes.ScriptEmbed]: blockTypesInfo.ScriptEmbed.guide,
  [BlockTypes.QAForm]: blockTypesInfo.QAForm.guide,
  [BlockTypes.Buttons]: blockTypesInfo.Buttons.guide,
  [BlockTypes.FileRequest]: blockTypesInfo.FileRequest.guide,
  [BlockTypes.Grid]: blockTypesInfo.Grid.guide,
};

export const IframelyBaseURL = "https://iframe.ly/api/iframely";
