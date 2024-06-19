/* eslint-disable jsx-a11y/anchor-has-content */
import _forEach from "lodash/forEach";
import _pick from "lodash/pick";
import _set from "lodash/set";
import _get from "lodash/get";
import _merge from "lodash/merge";
import _clone from "lodash/clone";
import React from "react";
import { connect } from "react-redux";
import { compose } from "redux";
import $ from "jquery";
import firebase from "firebase/compat/app";
import "firebase/compat/database";
import Parser from "rss-parser";
import HtmlReactParser, {
  attributesToProps,
  domToReact,
} from "html-react-parser";
import YouTube from "react-youtube";
import PropTypes from "prop-types";
import TextField from "@material-ui/core/TextField";
import Launch from "@material-ui/icons/LaunchOutlined";
import Button from "@material-ui/core/Button";
import DeleteIcon from "@material-ui/icons/DeleteOutlined";
import GetAppIcon from "@material-ui/icons/GetAppOutlined";
import InfoOutlinedIcon from "@material-ui/icons/InfoOutlined";
import FileCopyIcon from "@material-ui/icons/FileCopyOutlined";
import Vimeo from "@u-wave/react-vimeo";
import ReactQuill from "react-quill";
import Quill from "quill";
import styled from "styled-components";
import isObjectUrl from "@uppy/utils/lib/isObjectURL";
import clsx from "clsx";
import Dayjs from "dayjs";
import MuiSkeleton from "@material-ui/lab/Skeleton";
import Badge from "@material-ui/core/Badge";
import VisibilityOff from "@material-ui/icons/VisibilityOffOutlined";
import Tooltip from "@material-ui/core/Tooltip";
import CreateIcon from "@material-ui/icons/CreateOutlined";
import { withSnackbar } from "notistack";
import { sanitize } from "dompurify";
import { withRouter } from "react-router-dom";
import {
  getEditorModules,
  getEditorFormats,
  createUUID,
  getBlockFilesProp,
  getBlockFiles,
  getBlockUrlProp,
  blockFilesArrayToRaw,
  getCorsProxyForUrl,
  extractFiles,
  getCallableFbFunction,
  downloadAllFiles,
  makeBoardBlockMetadataUpdate,
  updateBlockMetadata,
  isMobile,
  idToEmail,
} from "../utils";
import { uppyFileToWhatboardFile } from "../uppy";
import withConfirm from "../withConfirm";
import {
  RssRefreshTimer,
  ThemeColors,
  getBlockDefaults,
  BlockTypes,
} from "../constant";
import Messenger from "../Messenger";
import CheckboxList from "../Checklist";
import access from "../access";
import AuthCheck from "../auth/AuthCheck";
import UserContext from "../auth/UserContext";
import QuillToolbar from "../QuillToolbar";
import { setHeaderColor } from "../actions/setting";
import FileList from "../FileList";
import CustomButton from "../CustomButton";
import FileRequest from "../components/block-renderer/FileRequest";
import Image from "../components/block-renderer/Image";
import GridSheet from "../components/block-renderer/GridSheet";
import PdfViewer from "../components/block-renderer/PdfViewer";

import "./Block.scss";

import BlockModal from "../BlockModal";
import { ColorItem } from "../components/style";
import IFrameWrapper from "./IFrameWrapper";
import Uploader from "./Uploader";
import ScriptEmbedViewer from "./ScriptEmbedViewer";
import withOnDatabaseEvent from "../withOnDatabaseEvent";
import Loader from "../components/Loader";

// const client = new HelloSign({
//   clientId: 'Your client ID'
// });
const Font = Quill.import("formats/font");
Font.whitelist = [
  "arial",
  "comic-sans",
  "courier-new",
  "georgia",
  "helvetica",
  "lucida",
  "francoisone",
  "ibmplexsans",
  "oswald",
  "roboto",
  "arimo",
];
Quill.register(Font, true);

const Toolbar = styled.div`
  background-color: ${(props) => props.color};
`;

const Skeleton = () => {
  return <MuiSkeleton variant="rect" width="100%" height="100%" />;
};

const htmlReactParserOptions = {
  /**
   * @param {import("html-react-parser").Element} domNode
   */
  replace(domNode) {
    if (domNode.type === "tag" && domNode.name === "a") {
      const existingRels = (domNode.attribs.rel || "").split(" ");
      const newRels = ["noreferrer", "noopener"];
      const uniqueRels = new Set([...existingRels, ...newRels]);
      uniqueRels.delete("opener");

      const relProp = Array.from(uniqueRels).join(" ");

      return (
        <a
          {...attributesToProps(domNode.attribs)}
          target="_blank"
          rel={relProp}
        >
          {domToReact(domNode.children, htmlReactParserOptions)}
        </a>
      );
    }

    return undefined;
  },
};

const blockDefaults = getBlockDefaults();

class Block extends React.Component {
  constructor(props) {
    super(props);
    this.checklistComponent = React.createRef();

    const state = {
      isNew: props.isNew,
      useIframely: props.useIframely,
      created_by: props.created_by,
      video_id: props.video_id,
      conversation: props.conversation,
      fullViewPageNumber: props.fullViewPageNumber || 1,
      pdf_path: props.pdf_path,
      image_path: props.image_path,
      imageLink: props.imageLink,
      checked: props.checked,
      header_title: props.header_title,
      type: props.type,
      blockTitle: props.title,
      isOpen: false,
      isTextEditorActive: false,
      id: props.isFullBlock ? props.match.params.id : props.id,
      board_id: props.isFullBlock
        ? props.match.params.board_id
        : props.board_id,
      board_name: props.board_name || "",
      index: props.index,
      defaultText: props.text,
      text: props.text,
      scriptEmbed: props.scriptEmbed,
      sheet_url: props.sheet_url,
      static: props.static,
      webhookURL: props.webhookURL,
      useWebhook: props.useWebhook,
      useQAWebhook: props.useQAWebhook,
      useButtonWebhook: props.useButtonWebhook,
      isFireMyActions: props.isFireMyActions,
      rss_url: props.rss_url,
      rssData: [],
      iframe_url: props.iframe_url,
      isPrivateTextBlock: props.isPrivateTextBlock,
      isTransparentTextBlock: props.isTransparentTextBlock,
      powerpoint_url: props.powerpoint_url,
      config: {
        type: "bar",
        series: [
          {
            values: [4, 5, 3, 4, 5, 3, 5, 4, 11],
          },
        ],
      },
      data: props.data,
      qa_data: props.qa_data,
      qaEmailBoardOwner: props.qaEmailBoardOwner,
      files: props.files,
      gridFiles: props.gridFiles,
      buttons: props.buttons,
      imageFiles: props.imageFiles,
      pdfFiles: props.pdfFiles,
      readOnly: props.readOnly,
      color: props.color,
      textEditorFiles: props.textEditorFiles,
      fileRequestFiles: props.fileRequestFiles,
      fileRequestSettings: props.fileRequestSettings,
      reload: false,
      qaAnswers: [],
      isFullBlockLoaded: false,
      filePopIndex: -1,
      isBlockDataLoaded: false,
      isNewBlockForLoggedInUser: false,
      isFilesLoading: false,
    };

    const { clone, files: extractedFiles } = extractFiles(state);

    this.state = {
      ...clone,
      extractedFiles,
    };

    const { board_id, id } = this.state;

    this.dbPath = `blocks/${board_id}/${id}`;

    this.showModal = this.showModal.bind(this);
    this.onDocLoadSuccess = this.onDocLoadSuccess.bind(this);
    this.incrementPage = this.incrementPage.bind(this);
    this.decrementPage = this.decrementPage.bind(this);
    this.sendData = this.sendData.bind(this);
    this.renderVideoPlayer = this.renderVideoPlayer.bind(this);
    this.authListeners = [];
    this.rssDataInterval = null;
  }

  componentDidMount() {
    const {
      isFullBlock,
      setHeaderColor: setHeaderColorProps,
      enqueueSnackbar,
      history,
    } = this.props;
    const { isNew, type, board_id, id, readOnly } = this.state;
    const { user } = this.context;

    if (isFullBlock) {
      const handleError = (error) => {
        if (error.code === "PERMISSION_DENIED") {
          history.push("/");
        } else {
          // eslint-disable-next-line no-console
          console.log(error);
          enqueueSnackbar(error.toString(), {
            variant: "error",
          });
        }
      };

      const boardRef = firebase.database().ref(`whiteboards/${board_id}`);
      boardRef.once(
        "value",
        (snap) => {
          const board = snap.val();
          setHeaderColorProps(board.board_header_color);
        },
        handleError
      );

      const blockRef = firebase.database().ref(`blocks/${board_id}/${id}`);
      blockRef.once(
        "value",
        (snap) => {
          const block = snap.val();
          this.setState(
            {
              ...getBlockDefaults(),
              ...block,
              blockTitle: block.title,
              isFullBlockLoaded: true,
            },
            () => {
              if (block.type === BlockTypes.RSS) {
                this.startRetrieveRSSdata();
              }
            }
          );
        },
        handleError
      );
    } else {
      if (type === BlockTypes.RSS) {
        this.startRetrieveRSSdata();
      }

      if (!readOnly) {
        if (isNew && this.canEditBlock(user)) {
          this.setState({ isOpen: true });
        }

        this.isNewBlockForLoggedInUser().then(
          ({ isNewBlock, loggedInLastViewed }) => {
            this.setState({
              isBlockDataLoaded: true,
              isNewBlockForLoggedInUser: isNewBlock,
              loggedInLastViewed,
            });
          }
        );
      }
    }

    document.addEventListener("mousedown", this.handleClickOutside);
  }

  componentDidUpdate(prevProps) {
    // --- FIXME ---
    // We really should not be doing this,
    // but I don't have time for a proper fix (that proper fix being NOT COPYING PROPS INTO STATE)
    const { isNew } = this.state;
    const { getBlockRef } = this.props;
    const updates = {};
    const blockRef = getBlockRef();
    if (isNew && blockRef.current) {
      blockRef.current.scrollIntoView({ block: "center", inline: "nearest" });
    }

    _forEach(this.props, (value, key) => {
      if (value !== prevProps[key]) {
        updates[key] = value;
      }
    });

    if (Object.keys(updates).length) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState(updates);
    }

    if (updates.rss_url) {
      this.startRetrieveRSSdata();
    }
    // --- FIXME ---
  }

  componentWillUnmount() {
    document.removeEventListener("mousedown", this.handleClickOutside);

    if (this.rssDataInterval) {
      clearInterval(this.rssDataInterval);
    }
  }

  onDocLoadSuccess(pdf) {
    this.setState({ maxPages: pdf.numPages });
  }

  getClassName() {
    const { isTransparentTextBlock } = this.state;

    return clsx({
      block: true,
      transparent: isTransparentTextBlock,
    });
  }

  getBlockbodyClassName() {
    const { className, isFullBlock } = this.props;

    return clsx(
      {
        "full-block-body": isFullBlock,
        "block-content": !isFullBlock,
      },
      className
    );
  }

  getYoutubeVideoId(videoUrl) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = videoUrl.match(regExp);

    if (match && match[2].length === 11) {
      return match[2];
    }

    return videoUrl;
  }

  setTextBlockWrapperRef = (node) => {
    this.textBlockWrapperRef = node;
  };

  mouseDown = (e) => {
    e.stopPropagation();
  };

  handleClickOutside = (event) => {
    if (
      this.textBlockWrapperRef &&
      !this.textBlockWrapperRef.contains(event.target)
    ) {
      this.handleEditorSave();
    }
  };

  renderRSSFeed = () => {
    const { rssData } = this.state;

    return (
      <div>
        {rssData.map((entry) => {
          return (
            <div className="rss" key={createUUID()}>
              <span>{entry.title}</span>
              <a className="rss-link" href={entry.link}>
                {entry.link}
              </a>
            </div>
          );
        })}
      </div>
    );
  };

  retrieveRSSdata = () => {
    /**
     * @todo Try to detect whether or not CORS proxy is actually necessary
     */
    const parser = new Parser({
      headers: {
        Accept:
          "application/rss+xml,application/atom+xml,text/xml;q=0.9,application/xml;q=0.9",
      },
    });
    const rssData = [];
    const that = this;
    const { rss_url } = this.state;
    if (!rss_url) return;

    const urlObj = new URL(rss_url);

    if (urlObj.hostname.includes("feedburner.com")) {
      urlObj.searchParams.set("format", "xml");
    }

    parser.parseURL(getCorsProxyForUrl(urlObj), (err, feed) => {
      if (err) throw err;
      feed.items.forEach((entry) => {
        rssData.push({
          title: entry.title,
          link: entry.link,
        });
      });

      that.setState({ rssData });
    });
  };

  startRetrieveRSSdata() {
    if (this.rssDataInterval) {
      clearInterval(this.rssDataInterval);
    }

    this.retrieveRSSdata();

    this.rssDataInterval = setInterval(this.retrieveRSSdata, RssRefreshTimer);
  }

  handleBlockClick = (e) => {
    if (e?.target?.closest?.("a")) {
      return;
    }

    e.preventDefault();
    const { type } = this.state;
    const { readOnly } = this.props;
    const { user } = this.context;

    if (type === BlockTypes.Text && !readOnly && this.canEditBlock(user)) {
      this.setState({ isTextEditorActive: true });
    }
  };

  handleEditorChange = (value) => {
    this.setState({ text: value });
  };

  handleChangeAnswer = (index, newAnswer) => {
    const { qaAnswers } = this.state;
    const newAnswers = [...qaAnswers];
    newAnswers[index] = newAnswer;
    this.setState({ qaAnswers: newAnswers });
  };

  findExtractedFilesKey = (extractedFiles, file) => {
    if (extractedFiles.has(file)) {
      return file;
    }

    if (extractedFiles.has(file.data)) {
      return file.data;
    }

    const key = Array.from(extractedFiles.keys()).find((extractedFile) => {
      return extractedFile.id === file.id;
    });

    return key;
  };

  handleUploadComplete = async (uppyFiles) => {
    if (!uppyFiles || !uppyFiles.length) {
      return;
    }

    const { enqueueSnackbar } = this.props;
    const { user } = this.context;
    const { extractedFiles } = this.state;

    const makeDbUpdatePath = (path) => {
      return `${this.dbPath}/${path.replaceAll(".", "/")}`;
    };

    try {
      const urlProp = getBlockUrlProp(this.state);

      const updates = {
        ...this.makeMetadataUpdate(),
      };

      const toAdd = new Map();

      uppyFiles.forEach((uppyFile) => {
        const key = this.findExtractedFilesKey(extractedFiles, uppyFile);

        if (key) {
          const paths = extractedFiles.get(key) || [];
          const fileObj = uppyFileToWhatboardFile(uppyFile, user);

          toAdd.set(key, {
            paths,
            fileObj,
          });
        }
      });

      if (!toAdd.size) {
        return;
      }

      toAdd.forEach(({ paths, fileObj }) => {
        if (paths.length) {
          paths.forEach((path) => {
            const updatePath = makeDbUpdatePath(path);
            updates[updatePath] = fileObj;
          });

          if (urlProp) {
            const updatePath = makeDbUpdatePath(urlProp);

            if (!updates[updatePath]) {
              updates[updatePath] = fileObj.filePath;
            }
          }
        }
      });

      await firebase.database().ref().update(updates);

      this.setState((state) => {
        const block = _pick(state, Object.keys(blockDefaults));
        const { extractedFiles: newExtractedFiles } = state;

        toAdd.forEach(({ paths, fileObj }, key) => {
          paths.forEach((path) => {
            _set(block, path, fileObj);
          });

          if (key.filePath && isObjectUrl(key.filePath)) {
            URL.revokeObjectURL(key.filePath);
          }

          newExtractedFiles.delete(key);
        });

        const newFilesProp = getBlockFilesProp(block);
        const newBlockFiles = getBlockFiles(block, true);
        const newUrlProp = getBlockUrlProp(block);

        const newState = {
          [newFilesProp]: _clone(newBlockFiles),
          extractedFiles: new Map(extractedFiles),
        };

        if (newUrlProp && newState[newFilesProp].length) {
          newState[newUrlProp] = newState[newFilesProp][0].filePath;
        }

        return newState;
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
      enqueueSnackbar(e.toString(), {
        variant: "error",
      });
    }
  };

  handleFileRemovedFromUpload = (file) => {
    this.setState((state) => {
      const { extractedFiles } = state;
      const key = this.findExtractedFilesKey(extractedFiles, file);

      const newState = {};

      if (key) {
        if (key.filePath && isObjectUrl(key.filePath)) {
          URL.revokeObjectURL(key.filePath);
        }

        extractedFiles.delete(key);
        newState.extractedFiles = new Map(extractedFiles);

        if (!newState.extractedFiles.size) {
          const block = _pick(state, Object.keys(blockDefaults));
          const filesProp = getBlockFilesProp(block);
          const blockFiles = getBlockFiles(block);
          const newFiles = blockFiles.filter(Boolean);

          newState[filesProp] = blockFilesArrayToRaw(block, newFiles);
        }
      }

      return newState;
    });
  };

  handleUploadCancelled = () => {
    this.setState((state) => {
      const block = _pick(state, Object.keys(blockDefaults));
      const filesProp = getBlockFilesProp(block);
      const blockFiles = getBlockFiles(block);

      const { extractedFiles } = state;

      extractedFiles.forEach((paths, file) => {
        if (file.filePath && isObjectUrl(file.filePath)) {
          URL.revokeObjectURL(file.filePath);
        }
      });

      const newFiles = blockFiles.filter(Boolean);

      const newState = {
        [filesProp]: blockFilesArrayToRaw(block, newFiles),
        extractedFiles: new Map(),
      };

      return newState;
    });
  };

  handleFileRequestUploadComplete = (uppyFiles) => {
    if (!uppyFiles || !uppyFiles.length) {
      return;
    }

    this.setState((state) => {
      const block = _pick(state, Object.keys(blockDefaults));

      const filesProp = getBlockFilesProp(block);
      const blockFiles = getBlockFiles(block, true);
      const newFiles = _clone(blockFiles);
      const path = `${this.dbPath}/${filesProp}`;

      uppyFiles.forEach((uppyFile) => {
        const ref = firebase.database().ref(path).push();
        const fileId = ref.key;
        const wbFile = uppyFileToWhatboardFile(uppyFile);
        wbFile.meta.fileId = fileId;
        newFiles[fileId] = wbFile;
      });

      const updates = {
        [filesProp]: newFiles,
      };

      const { clone, files: extractedFiles } = extractFiles(updates);

      const newState = {
        ...clone,
        extractedFiles,
      };

      return newState;
    });
  };

  handleFileRequestFileRemoved = async (removeFile) => {
    const { enqueueSnackbar } = this.props;

    try {
      const block = _pick(this.state, Object.keys(blockDefaults));

      const filesProp = getBlockFilesProp(block);

      const updates = {
        [`${this.dbPath}/${filesProp}/${removeFile.id}`]: null,
        ...this.makeMetadataUpdate(),
      };

      await firebase.database().ref().update(updates);

      this.setState((state) => {
        const newBlock = _pick(state, Object.keys(blockDefaults));
        const newFilesProp = getBlockFilesProp(newBlock);
        const blockFiles = getBlockFiles(newBlock);

        const newFiles = blockFiles.filter((file) => file !== removeFile);

        const newState = {
          [newFilesProp]: blockFilesArrayToRaw(newBlock, newFiles),
        };

        return newState;
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
      enqueueSnackbar(e.toString(), {
        variant: "error",
      });
    }
  };

  makeMetadataUpdate() {
    const { board_id, id } = this.state;
    const { user } = this.context;

    const updates = makeBoardBlockMetadataUpdate(board_id, id, user.wbid);

    return updates;
  }

  submitQAAnswer = async () => {
    const { enqueueSnackbar } = this.props;
    const { qaAnswers, board_id, id } = this.state;
    const updates = {
      ...this.makeMetadataUpdate(),
    };

    qaAnswers.forEach((qaAnswer, index) => {
      updates[`blocks/${board_id}/${id}/qa_data/${index}/answer`] = qaAnswer;
    });

    try {
      await firebase.database().ref().update(updates);

      enqueueSnackbar("Your answers have been submitted", {
        variant: "success",
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
      enqueueSnackbar(e.toString(), {
        variant: "error",
      });
    }
  };

  handlePopoutFile = async (file, index) => {
    const { sendData, confirm, created_by } = this.props;
    const { board_id } = this.state;
    const { user } = this.context;

    const block = _pick(this.state, Object.keys(blockDefaults));
    const filesProp = getBlockFilesProp(block);
    const blockFiles = getBlockFiles(block);

    let isDelete = true;
    let isSymlink = false;

    try {
      if (created_by === user.wbid) {
        await confirm({
          title:
            "Do you want to delete this file from current Block after popping it to a new Block?",
          confirmationText: "Yes",
          cancellationText: "No",
        });
      } else {
        isSymlink = true;
        isDelete = false;
      }
    } catch (error) {
      isDelete = false;
    }

    this.setState({ filePopIndex: index });

    const BlockRef = firebase.database().ref(`blocks/${board_id}`).push();
    let updatedFileList = [];

    const updatedFile = {
      ...file,
    };

    if (isSymlink) {
      updatedFile.storagePath = null;
    }

    updatedFileList = [updatedFile];

    sendData(
      {
        updatedFileList,
        block_id: BlockRef.key,
        onComplete: () => {
          if (isDelete) {
            const newFiles = blockFiles.filter((fileObj) => fileObj !== file);
            const rawFiles = blockFilesArrayToRaw(block, newFiles);

            const updates = {
              [`${this.dbPath}/${filesProp}`]: rawFiles,
              ...this.makeMetadataUpdate(),
            };

            firebase.database().ref().update(updates);

            this.setState({ filePopIndex: -1, [filesProp]: rawFiles });
          } else {
            this.setState({ filePopIndex: -1 });
          }
        },
      },
      "moveFilesToNewBlock"
    );
  };

  canEditBlock = (user) => {
    return access.canEditBlock(this.state, user);
  };

  canDeleteBlock = (user) => {
    const { board } = this.props;
    return access.canDeleteBlock(this.state, board, user);
  };

  handleEditorSave = () => {
    const { text } = this.state;

    this.setState({ isTextEditorActive: false });

    const updates = {
      [`${this.dbPath}/text`]: text,
      ...this.makeMetadataUpdate(),
    };

    firebase
      .database()
      .ref()
      .update(updates, () => {});
  };

  isNewBlockForLoggedInUser = async () => {
    const { board_id, metadata } = this.props;
    const { id } = this.state;
    const { user: contextUser } = this.context;
    const blockLastModified = _get(metadata, "lastModified");
    const loggedInLastViewed = _get(metadata, `lastViewed.${contextUser.wbid}`);

    // Update new lastViewed
    updateBlockMetadata(board_id, id, contextUser.wbid, {
      updateLastModified: false,
      updateLastViewed: true,
    });

    return {
      isNewBlock:
        blockLastModified &&
        Dayjs(blockLastModified).isAfter(Dayjs(loggedInLastViewed)),
      loggedInLastViewed,
    };
  };

  showModal() {
    const { itemLeaveAction, headerColor } = this.props;
    this.setState({ isOpen: true }, () => {
      $("select")
        .find("option")
        .click(() => {});

      if (headerColor === ThemeColors.NOCOLOR) itemLeaveAction();
    });
  }

  cloneBlock = async () => {
    const { sendData, confirm, created_by } = this.props;
    const { id } = this.state;
    const { user } = this.context;

    try {
      if (created_by === user.wbid) {
        await confirm({
          title: "Do you want to clone this Block?",
          confirmationText: "Yes",
          cancellationText: "No",
        });

        sendData({ block_id: id }, "cloneBlock");
      }
    } catch (e) {
      if (e) {
        throw e;
      }
    }
  };

  incrementPage(evt) {
    if (evt) evt.stopPropagation();
    const { fullViewPageNumber, maxPages, board_id } = this.state;
    const { board } = this.props;
    const { user } = this.context;

    if (fullViewPageNumber < maxPages) {
      this.setState({ fullViewPageNumber: fullViewPageNumber + 1 });
      if (access.isBoardOwner(board, user)) {
        const boardRef = firebase.database().ref(`whiteboards/${board_id}`);
        boardRef.update({ fullViewPageNumber: fullViewPageNumber + 1 });
      }
    }
  }

  decrementPage(evt) {
    if (evt) evt.stopPropagation();
    const { fullViewPageNumber, board_id } = this.state;
    const { board, isFullView } = this.props;
    const { user } = this.context;

    if (fullViewPageNumber !== 1) {
      this.setState({ fullViewPageNumber: fullViewPageNumber - 1 });
      if (access.isBoardOwner(board, user) && isFullView) {
        const boardRef = firebase.database().ref(`whiteboards/${board_id}`);
        boardRef.update({ fullViewPageNumber: fullViewPageNumber - 1 });
      }
    }
  }

  sendData(val, type) {
    const { sendData } = this.props;

    if (type === "cancel") {
      this.setState({
        isOpen: false,
        isNew: false,
      });
    } else {
      this.setState({
        isOpen: false,
      });
      this.setState(val, () => {
        if (val.type === BlockTypes.RSS) {
          this.retrieveRSSdata();
        }
      });
    }

    if (sendData) {
      sendData(val, type);
    }
  }

  renderVideoPlayer() {
    const { video_id } = this.state;

    const opts = {
      height: "100%",
      width: "100%",
      playerVars: {
        autoplay: 0,
      },
    };

    if (video_id.includes("vimeo.com")) {
      return (
        <Vimeo
          className="youtube-frame"
          video={video_id.replace("https://vimeo.com/", "")}
        />
      );
    }
    if (video_id.includes("www.youtube.com") || video_id.includes("youtu.be")) {
      return (
        <YouTube
          className="youtube-frame"
          containerClassName="full-height"
          videoId={this.getYoutubeVideoId(video_id)}
          opts={opts}
        />
      );
    }

    return (
      <IFrameWrapper
        block={this.state}
        title="Twitch"
        frameSrc={`https://player.twitch.tv/?allowfullscreen=true&autoplay=true&channel=${video_id
          .replace("https://www.twitch.tv/", "")
          .replace(
            "https://twitch.tv/",
            ""
          )}&controls=true&height=100%25&migration=true&muted=true&parent=${
          window.location.hostname
        }&playsinline=true`}
      />
    );
  }

  renderOpenInNewWindowButton() {
    let content = null;
    const { state } = this;
    const { type } = state;
    const urlProps = {
      Image: "image_path",
      PDF: "pdf_path",
      Spreadsheet: "sheet_url",
      Iframe: "iframe_url",
      Powerpoint: "powerpoint_url",
    };
    const urlProp = urlProps[type];

    if (urlProp) {
      const url = state[urlProp];
      content = (
        <Tooltip
          title="Open in new tab"
          aria-label="Open in new tab"
          placement="top"
        >
          <Launch
            className="launch--icon"
            fontSize="inherit"
            onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
          />
        </Tooltip>
      );
    }

    return content;
  }

  renderPrivateIcon = () => {
    let content = null;
    const { isPrivateTextBlock } = this.props;

    if (isPrivateTextBlock) {
      content = (
        <Tooltip
          title="This block is private, only visible to you."
          aria-label="This block is private, only visible to you."
          placement="top"
        >
          <VisibilityOff fontSize="inherit" className="private--icon" />
        </Tooltip>
      );
    }

    return content;
  };

  handleButtonClick = async (button) => {
    const { id, webhookURL, useButtonWebhook, board_id } = this.state;
    const { enqueueSnackbar } = this.props;
    const func = getCallableFbFunction("blocks-callButtonWebhook");

    if (button.url) {
      window.open(button.url, "_blank", "noopener,noreferrer");
    }

    if (webhookURL !== "" && useButtonWebhook) {
      const params = {
        boardId: board_id,
        blockId: id,
        buttonId: button.id,
      };

      try {
        await func(params);

        if (!button.url) {
          enqueueSnackbar("Thank you, your request has been submitted", {
            variant: "success",
          });
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(e);
        enqueueSnackbar(e.toString(), {
          variant: "error",
        });
      }
    }
  };

  sanitizeHtml(html) {
    return sanitize(html);
  }

  handleClickExpand = () => {
    const { id, board_id } = this.state;
    const { board } = this.props;
    const { user } = this.context;
    if (access.isBoardOwner(board, user)) {
      const boardRef = firebase.database().ref(`whiteboards/${board_id}`);
      boardRef.update({ fullViewId: id, fullViewPageNumber: 1 });
    }
  };

  handleCloseFullView = () => {
    const { board_id } = this.state;
    const { board } = this.props;
    const { user } = this.context;

    if (access.isBoardOwner(board, user)) {
      const boardRef = firebase.database().ref(`whiteboards/${board_id}`);
      boardRef.update({ fullViewId: null, fullViewPageNumber: 1 });
    }
  };

  renderBlockBody = (blockBodyJSX) => {
    const { isFilesLoading } = this.state;
    let data = blockBodyJSX;

    if (isFilesLoading) {
      data = (
        <div className="block-content-loader-wrapper">
          {blockBodyJSX}
          <Loader isFullScreen />
        </div>
      );
    }

    return data;
  };

  render() {
    const {
      text,
      type,
      pdf_path,
      id,
      reload,
      blockTitle,
      sheet_url,
      iframe_url,
      isOpen,
      board_id,
      video_id,
      fullViewPageNumber,
      maxPages,
      checked,
      data,
      qa_data,
      buttons,
      powerpoint_url,
      isTextEditorActive,
      files,
      gridFiles,
      isFullBlockLoaded,
      useIframely,
      extractedFiles,
      filePopIndex,
      isBlockDataLoaded,
      isNewBlockForLoggedInUser,
      loggedInLastViewed,
      color,
      isTransparentTextBlock,
      image_path,
      imageLink,
      static: stateStatic,
    } = this.state;

    const {
      board,
      created_by,
      dateCreated,
      enqueueSnackbar,
      headerColor,
      isFocus,
      isFullBlock,
      isFullView,
      metadata,
      readOnly,
    } = this.props;
    const { user: contextUser } = this.context;
    const mobile = isMobile();

    if (isFullBlock && !isFullBlockLoaded) return null;

    if (!isFullBlock && !isBlockDataLoaded && !readOnly) {
      return (
        <div className="block" id={id}>
          <div className={this.getBlockbodyClassName()}>
            <Skeleton />
          </div>
        </div>
      );
    }

    if (extractedFiles instanceof Map && extractedFiles.size) {
      return (
        <div className="block" id={id}>
          <div className={this.getBlockbodyClassName()}>
            <Uploader
              extractedFiles={extractedFiles}
              block={this.state}
              onUploadComplete={this.handleUploadComplete}
              onFileRemoved={this.handleFileRemovedFromUpload}
              onUploadCancelled={this.handleUploadCancelled}
            />
          </div>
        </div>
      );
    }

    let pdfDlPath = pdf_path;

    if (
      pdfDlPath &&
      pdfDlPath.indexOf("armspaces.appspot.com") === -1 &&
      pdfDlPath.indexOf(process.env.REACT_APP_FIREBASE_STORAGE_BUCKET) === -1
    ) {
      pdfDlPath = getCorsProxyForUrl(pdfDlPath);
    }

    const blockBody = (
      <>
        {type === BlockTypes.Text && !isTextEditorActive && (
          <div
            className="block-content-wrapper ql-editor"
            onClick={this.handleBlockClick}
            onKeyPress={this.handleBlockClick}
            role="button"
            tabIndex="0"
          >
            {HtmlReactParser(this.sanitizeHtml(text), htmlReactParserOptions)}
          </div>
        )}
        {type === BlockTypes.Text && isTextEditorActive && (
          <div
            ref={this.setTextBlockWrapperRef}
            className="html-editor--container"
          >
            <QuillToolbar isSkinny user={contextUser} />
            <ReactQuill
              theme="snow"
              defaultValue={text}
              delta={text}
              className="html-editor--editor"
              onChange={this.handleEditorChange}
              modules={getEditorModules()}
              formats={getEditorFormats()}
            />
          </div>
        )}
        {type === BlockTypes.Spreadsheet && (
          <IFrameWrapper
            block={this.state}
            frameSrc={sheet_url}
            title="Spreadsheet"
          />
        )}
        {type === BlockTypes.RSS && this.renderRSSFeed()}
        {type === BlockTypes.ScriptEmbed && (
          <ScriptEmbedViewer
            boardId={board_id}
            blockId={id}
            cacheBuster={metadata?.lastModified}
            title="HTML Script Embed"
          />
        )}
        {type === BlockTypes.Iframe && (
          <IFrameWrapper
            block={this.state}
            frameSrc={iframe_url}
            title="WebPage"
            useIframely={useIframely}
            isIframe
          />
        )}
        {type === BlockTypes.Powerpoint && (
          <IFrameWrapper
            block={this.state}
            frameSrc={powerpoint_url.replace(/&amp;/g, "&")}
            title="Powerpoint"
          />
        )}
        {type === BlockTypes.Conversation && (
          <Messenger
            id={id}
            board_id={board_id}
            readOnly={readOnly}
            loggedInLastViewed={loggedInLastViewed}
          />
        )}
        {type === BlockTypes.Video && video_id && (
          <>{this.renderVideoPlayer()}</>
        )}
        {type === BlockTypes.PDF && (
          <PdfViewer
            onExpand={this.handleClickExpand}
            onClose={this.handleCloseFullView}
            pdfUrl={pdfDlPath}
            onLoadSuccess={this.onDocLoadSuccess}
            maxPages={maxPages}
            pageNumber={fullViewPageNumber}
            headerColor={headerColor}
            onNextPage={this.incrementPage}
            onPrevPage={this.decrementPage}
            isFullScreenMode={isFullView}
          />
        )}
        {type === BlockTypes.Checklist && (
          <div
            className="checkboxlist"
            onMouseDown={this.mouseDown}
            role="button"
            tabIndex="0"
          >
            <CheckboxList
              board_id={board_id}
              block_id={id}
              checked={checked}
              data={data}
            />
          </div>
        )}
        {type === BlockTypes.QAForm && (
          <div className="qalist" role="button" tabIndex="0">
            {qa_data.map((item, index) => (
              <div
                className="qalist-qaitem"
                key={`${item.question}-${item.answer}`}
              >
                <div className="qalist-qaitem-question">{item.question}</div>
                <TextField
                  rows={2}
                  multiline
                  className="qalist-qaitem-answer"
                  onChange={(e) =>
                    this.handleChangeAnswer(index, e.target.value)
                  }
                />
              </div>
            ))}
            <Button
              variant="outlined"
              type="button"
              onClick={() => this.submitQAAnswer()}
              className="qalist-submit"
            >
              Submit
            </Button>
          </div>
        )}
        {type === BlockTypes.Image && (
          <Image
            imagePath={image_path}
            onExpand={this.handleClickExpand}
            onClose={this.handleCloseFullView}
            imageLink={imageLink}
            isFullScreenMode={isFullView}
          />
        )}
        {type === BlockTypes.Files &&
          (filePopIndex < 0 ? (
            <FileList
              files={files}
              isPopout={!readOnly}
              handlePopoutFile={this.handlePopoutFile}
              orderBy={[{ prop: "fileName", dir: "asc" }]}
            />
          ) : (
            <div className="popfile-progress-container">
              <Skeleton />
            </div>
          ))}
        {type === BlockTypes.Buttons && (
          <div className="button-list">
            {buttons.map((button) => (
              <CustomButton
                button={button}
                key={button.id}
                onClick={() => this.handleButtonClick(button)}
              />
            ))}
          </div>
        )}
        {type === BlockTypes.FileRequest && (
          <FileRequest
            block={this.state}
            onUploadComplete={this.handleFileRequestUploadComplete}
            FileListComponent={filePopIndex < 0 ? undefined : Skeleton}
            FileListComponentProps={
              filePopIndex < 0
                ? {
                    isRemovable: true,
                    isPopout: !readOnly,
                    handleRemoveFile: this.handleFileRequestFileRemoved,
                    handlePopoutFile: this.handlePopoutFile,
                    loggedInLastViewed,
                  }
                : undefined
            }
          />
        )}

        {type === BlockTypes.Grid && !!gridFiles.length && (
          <GridSheet csvPath={gridFiles[0].filePath} />
        )}
      </>
    );

    if (isFullBlock) {
      return (
        <div className="full-block">
          <Toolbar
            className={
              headerColor === ThemeColors.WHITE ? "tool-bar white" : "tool-bar"
            }
            color={headerColor}
          >
            <div className="tool-bar-left">
              <h1 id="board-title">{blockTitle}</h1>
            </div>
          </Toolbar>
          <div className={this.getBlockbodyClassName()}>{blockBody}</div>
        </div>
      );
    }

    let blockModalMode = "edit";
    const canEditBlock = this.canEditBlock(contextUser);
    const canDeleteBlock = this.canDeleteBlock(contextUser);

    if (!canEditBlock && canDeleteBlock) {
      blockModalMode = "delete";
    }

    const blockModalProps = _merge({}, this.state, {
      sendData: this.sendData,
      mode: blockModalMode,
      board,
    });

    const blockFiles = getBlockFiles(this.state);
    const handleDownloadAllFiles = async () => {
      this.setState({ isFilesLoading: true });
      try {
        await downloadAllFiles(blockFiles, blockTitle, board.board_name);
      } catch (e) {
        enqueueSnackbar(e.toString(), {
          variant: "error",
        });
      } finally {
        this.setState({ isFilesLoading: false });
      }
    };

    return (
      <Badge
        color="secondary"
        variant="dot"
        anchorOrigin={{ vertical: "top", horizontal: "left" }}
        component="div"
        invisible={!isNewBlockForLoggedInUser}
      >
        <div className={this.getClassName()} id={id}>
          {!reload && (
            <>
              <ColorItem
                className={clsx({
                  "block-title-bar": true,
                  "dark-font": color === "#ffffff" || color === "#f1f1f1",
                  "bottom-border":
                    (isFocus &&
                      headerColor === ThemeColors.NOCOLOR &&
                      color === "#ffffff") ||
                    (color === "#ffffff" && ThemeColors.WHITE === headerColor),
                })}
                style={{
                  backgroundColor:
                    isTransparentTextBlock && !isFocus ? "transparent" : color,
                }}
              >
                <div className="block-title-bar-content" hidden={!isFocus}>
                  <div
                    className={clsx({
                      block_title: true,
                      drag: !stateStatic,
                    })}
                  >
                    {blockTitle}
                  </div>
                  <div className="block-actions" hidden={mobile}>
                    {this.renderOpenInNewWindowButton()}

                    {(type === BlockTypes.Files ||
                      type === BlockTypes.FileRequest) && (
                      <Tooltip
                        title="Download all files"
                        placement="top"
                        interactive
                      >
                        <GetAppIcon
                          id="download_button"
                          onClick={() => handleDownloadAllFiles()}
                          onKeyPress={() => handleDownloadAllFiles()}
                          role="button"
                          tabIndex="0"
                          fontSize="inherit"
                          className="download--icon"
                        />
                      </Tooltip>
                    )}
                    {this.renderPrivateIcon()}
                    {type !== BlockTypes.Files &&
                      type !== BlockTypes.Conversation && (
                        <AuthCheck accessCheck={this.canEditBlock}>
                          <Tooltip
                            title="Clone block"
                            placement="top"
                            interactive
                          >
                            <FileCopyIcon
                              id="clone_button"
                              onClick={this.cloneBlock}
                              onKeyPress={this.cloneBlock}
                              role="button"
                              tabIndex="0"
                              fontSize="inherit"
                              className="clone--icon"
                            />
                          </Tooltip>
                        </AuthCheck>
                      )}
                    <AuthCheck accessCheck={this.canEditBlock}>
                      <Tooltip title="Edit block" placement="top" interactive>
                        <CreateIcon
                          id="edit_button"
                          onClick={this.showModal}
                          onKeyPress={this.showModal}
                          role="button"
                          tabIndex="0"
                          fontSize="inherit"
                          className="create--icon"
                        />
                      </Tooltip>
                    </AuthCheck>
                    <AuthCheck
                      accessCheck={(user) =>
                        !this.canEditBlock(user) && this.canDeleteBlock(user)
                      }
                    >
                      <Tooltip placement="top" title="Delete block">
                        <DeleteIcon
                          id="delete_button"
                          onClick={this.showModal}
                          onKeyPress={this.showModal}
                          role="button"
                          tabIndex="0"
                          fontSize="inherit"
                          className="delete--icon"
                        />
                      </Tooltip>
                    </AuthCheck>
                    {!readOnly && (
                      <Tooltip
                        placement="top"
                        title={
                          <>
                            Created by: {idToEmail(created_by)}
                            <br />
                            Created on:{" "}
                            {Dayjs(dateCreated).format("YYYY-MM-DD")}
                          </>
                        }
                      >
                        <InfoOutlinedIcon
                          id="info_button"
                          role="button"
                          tabIndex="0"
                          fontSize="inherit"
                          className="info--icon"
                        />
                      </Tooltip>
                    )}
                  </div>
                </div>
              </ColorItem>
              <div className={this.getBlockbodyClassName()}>
                {this.renderBlockBody(blockBody)}
              </div>

              <div
                onMouseDown={this.mouseDown}
                onMouseEnter={(e) => e.stopPropagation()}
                onMouseOver={(e) => e.stopPropagation()}
                onFocus={() => {}}
                onMouseLeave={(e) => e.stopPropagation()}
                role="button"
                tabIndex="0"
              >
                {isOpen && (canEditBlock || canDeleteBlock) && (
                  <BlockModal {...blockModalProps} />
                )}
              </div>
            </>
          )}
        </div>
      </Badge>
    );
  }
}

Block.contextType = UserContext;

Block.defaultProps = {
  board_id: "",
  buttons: [],
  checked: [],
  conversation: [],
  created_by: "",
  dateCreated: "",
  data: [],
  files: [],
  header_title: "",
  id: "",
  iframe_url: "",
  image_path: "",
  imageLink: "",
  imageFiles: [],
  isFireMyActions: false,
  isFocus: false,
  isFullBlock: false,
  isNew: false,
  isPrivateTextBlock: false,
  isTransparentTextBlock: false,
  metadata: {},
  pdf_path: "",
  pdfFiles: [],
  powerpoint_url: "",
  qa_data: [],
  qaEmailBoardOwner: true,
  readOnly: false,
  rss_url: "",
  sheet_url: "",
  static: false,
  text: BlockTypes.Text,
  color: "#ffffff",
  title: "",
  type: "",
  useButtonWebhook: false,
  useQAWebhook: false,
  useWebhook: false,
  video_id: "",
  webhookURL: "",
  textEditorFiles: [],
  fileRequestFiles: {},
  fileRequestSettings: {},
};

Block.propTypes = {
  board_id: PropTypes.string,
  buttons: PropTypes.instanceOf(Array),
  checked: PropTypes.instanceOf(Array),
  conversation: PropTypes.instanceOf(Array),
  created_by: PropTypes.string,
  dateCreated: PropTypes.string,
  data: PropTypes.instanceOf(Array),
  files: PropTypes.instanceOf(Array),
  header_title: PropTypes.string,
  id: PropTypes.string,
  iframe_url: PropTypes.string,
  image_path: PropTypes.string,
  imageLink: PropTypes.string,
  imageFiles: PropTypes.instanceOf(Array),
  isFireMyActions: PropTypes.bool,
  isFocus: PropTypes.bool,
  isFullBlock: PropTypes.bool,
  isNew: PropTypes.bool,
  isPrivateTextBlock: PropTypes.bool,
  isTransparentTextBlock: PropTypes.bool,
  metadata: PropTypes.shape({}),
  pdf_path: PropTypes.string,
  pdfFiles: PropTypes.instanceOf(Array),
  title: PropTypes.string,
  color: PropTypes.string,
  powerpoint_url: PropTypes.string,
  qa_data: PropTypes.instanceOf(Array),
  qaEmailBoardOwner: PropTypes.bool,
  readOnly: PropTypes.bool,
  rss_url: PropTypes.string,
  sheet_url: PropTypes.string,
  static: PropTypes.bool,
  text: PropTypes.string,
  type: PropTypes.string,
  useButtonWebhook: PropTypes.bool,
  useQAWebhook: PropTypes.bool,
  useWebhook: PropTypes.bool,
  video_id: PropTypes.string,
  webhookURL: PropTypes.string,
  textEditorFiles: PropTypes.instanceOf(Array),
  fileRequestFiles: PropTypes.shape({}),
  fileRequestSettings: PropTypes.shape({}),
};

const mapStateToProps = (state) => ({
  headerColor: state.setting.headerColor,
});

const enchance = compose(
  withSnackbar,
  connect(mapStateToProps, { setHeaderColor }),
  withConfirm(),
  withOnDatabaseEvent(),
  withRouter
);

export default enchance(Block);
