import _throttle from "lodash/throttle";
import _filter from "lodash/filter";
import _findIndex from "lodash/findIndex";
import _escape from "lodash/escape";
import _pick from "lodash/pick";
import _cloneDeep from "lodash/cloneDeep";
import firebase from "firebase/compat/app";
import "firebase/compat/database";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import PropTypes from "prop-types";
import React, { Component } from "react";
import { compose } from "redux";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import HelpIcon from "@material-ui/icons/HelpOutlineOutlined";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutlineOutlined";
import Tooltip from "@material-ui/core/Tooltip";
import Accordion from "@material-ui/core/Accordion";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import AccordionDetails from "@material-ui/core/AccordionDetails";
import Typography from "@material-ui/core/Typography";
import Snackbar from "@material-ui/core/Snackbar";
import Alert from "@material-ui/lab/Alert";
import Checkbox from "@material-ui/core/Checkbox";
import FormGroup from "@material-ui/core/FormGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Popover from "@material-ui/core/Popover";
import Divider from "@material-ui/core/Divider";
import { CirclePicker } from "react-color";
import Add from "@material-ui/icons/AddOutlined";
import Clear from "@material-ui/icons/ClearOutlined";
import PopupState, { bindTrigger, bindPopover } from "material-ui-popup-state";
import UrlOrUpload from "../UrlOrUpload";
import FileDeleteWarning from "../FileDeleteWarning";
import Stack from "../components/Stack";
import TextEditor from "./TextEditor";
import UrlField from "./UrlField";

import {
  createUUID,
  isBlockTypeEmpty,
  extractFiles,
  getBlockUrlProp,
  getBlockFiles,
  getBlockFilesProp,
  makeBoardBlockMetadataUpdate,
  httpToHttps,
  containsDataForBlockType,
} from "../utils";
import { uppyFileToWhatboardFile } from "../uppy";
import "./BlockModal.scss";
import UserContext from "../auth/UserContext";
import {
  BlockTypes,
  blockTypesInfo,
  blockTypeLabels,
  getBlockDefaults,
  blockTypeGuides,
  blockColors,
  customButtonProps,
} from "../constant";
import "react-quill/dist/quill.snow.css";
import FileList from "../FileList";
import CustomButton from "../CustomButton";
import ButtonOptionPanel from "../ButtonOptionPanel";
import withConfirm from "../withConfirm";
import BlockTypeMenuItem from "../BlockTypeMenuItem/BlockTypeMenuItem";

const blockDefaults = getBlockDefaults();

class BlockModal extends Component {
  static propsTypes = {
    isNew: PropTypes.bool,
    useWebhook: PropTypes.bool,
    useQAWebhook: PropTypes.bool,
    useButtonWebhook: PropTypes.bool,
    isFireMyActions: PropTypes.bool,
    useIframely: PropTypes.bool,
    blockTitle: PropTypes.string,
    type: PropTypes.string,
    text: PropTypes.string,
    sheet_url: PropTypes.string,
    rss_url: PropTypes.string,
    iframe_url: PropTypes.string,
    video_id: PropTypes.string,
    dataInputs: PropTypes.array,
    pdf_path: PropTypes.string,
    color: PropTypes.string,
    image_path: PropTypes.string,
    id: PropTypes.string,
    board_id: PropTypes.string,
    powerpoint_url: PropTypes.string,
    webhookURL: PropTypes.string,
    mode: PropTypes.oneOf(["edit", "delete"]),
  };

  constructor(props) {
    super(props);
    const {
      isNew,
      useIframely,
      type,
      dataInputs,
      video_id,
      sheet_url,
      rss_url,
      pdf_path,
      image_path,
      imageLink,
      iframe_url,
      blockTitle,
      text,
      board_id,
      id,
      data,
      scriptEmbed,
      qa_data,
      qaEmailBoardOwner,
      powerpoint_url,
      files,
      gridFiles,
      buttons,
      imageFiles,
      isPrivateTextBlock,
      isTransparentTextBlock,
      pdfFiles,
      webhookURL,
      useWebhook,
      useQAWebhook,
      useButtonWebhook,
      isFireMyActions,
      color,
      textEditorFiles,
      fileRequestSettings,
      fileRequestFiles,
    } = this.props;
    this.state = {
      isNew,
      useIframely,
      type,
      dataInputs,
      video_id,
      sheet_url,
      rss_url,
      pdf_path,
      image_path,
      imageLink,
      iframe_url,
      data,
      qa_data,
      qaEmailBoardOwner,
      blockTitle: blockTitle || type,
      text,
      board_id,
      id,
      scriptEmbed,
      powerpoint_url,
      webhookURL,
      useWebhook,
      useQAWebhook,
      useButtonWebhook,
      isFireMyActions,
      files,
      gridFiles,
      imageFiles,
      color,
      pdfFiles,
      buttons,
      isAlertOpen: false,
      isPrivateTextBlock,
      isTransparentTextBlock,
      errorMessage: "",
      submitButtonClicked: "",
      displayColorPicker: false,
      textEditorFiles,
      isSubmitting: false,
      fileRequestSettings,
      fileRequestFiles,
      openButtonId: "",
    };

    this.reactQuillRef = React.createRef();
    this.uppy = undefined;

    this.btnref = React.createRef();
    this.dbPath = `blocks/${board_id}/${id}`;
    this.canEdit = false;
    this.deleteItem = this.deleteItem.bind(this);
    this.removeChecklistItem = this.removeChecklistItem.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleQAItemChange = this.handleQAItemChange.bind(this);
    this.getUploadProps = this.getUploadProps.bind(this);
    this.handleUrlUploadChange = this.handleUrlUploadChange.bind(this);
    this.getTypeState = this.getTypeState.bind(this);
    this.onBlockTypeChange = this.onBlockTypeChange.bind(this);
    this.hideModal = this.hideModal.bind(this);
    this.saveModal = this.saveModal.bind(this);
    this.addChecklistItem = this.addChecklistItem.bind(this);
    this.removeQAItem = this.removeQAItem.bind(this);
    this.addQAItem = this.addQAItem.bind(this);
    this.handleColorChange = this.handleColorChange.bind(this);
    this.handleOpenColorPicker = this.handleOpenColorPicker.bind(this);
    this.handleCloseColorPicker = this.handleCloseColorPicker.bind(this);
    this.addChecklistItem = _throttle(this.addChecklistItem, 1000);
  }

  componentWillUnmount() {
    this.addChecklistItem.cancel();
  }

  async onBlockTypeChange(event) {
    try {
      const type = event.target.value;
      const { type: prevType } = this.state;

      if (type === prevType) {
        return;
      }

      const { confirm } = this.props;
      if (!isBlockTypeEmpty(this.state, prevType)) {
        await confirm({
          title: "Are you sure you want to change Block types?",
          description: `Upon saving this Block, all data associated with the "${blockTypeLabels[prevType]}" type for this Block will be destroyed and replaced with the data for the "${blockTypeLabels[type]}" type. Are you sure you want to continue?`,
          confirmationText: "Change",
        });
      }

      this.setState({
        blockTitle: "",
        type,
      });
    } catch (e) {
      // Cancelling a confirmation dialog results in a rejected Promise, but said rejection always returns `undefined`, whereas
      // other exceptions or rejected Promises will usually be an object of some sort.
      if (e) {
        throw e;
      }
    }
  }

  handleColorChange(color) {
    this.setState({ color: color.hex, displayColorPicker: false });
  }

  getInputProps() {
    const { state } = this;
    const { type } = state;

    const placeholderText = {
      Text: "Text...",
      Data: "Link to chart...",
      Spreadsheet: "Link to sheet...",
      Grid: "Link To Sheet...",
      Video: "Twitch, Youtube, or Vimeo URL...",
      RSS: "Link to RSS feed...",
      Iframe: "Web Page URL",
      Powerpoint: "EMBED MSFT Powerpoint URL",
    };
    const typeState = this.getTypeState();
    const inputProps = {
      type: "text",
      value: state[typeState],
      autoComplete: "off",
      id: "text_node",
      onChange: this.handleChange,
      fullWidth: true,
      label: placeholderText[type],
    };

    return inputProps;
  }

  getTypeState() {
    const { type: typeState } = this.state;
    const type = {
      Image: "image_path",
      PDF: "pdf_path",
      Spreadsheet: "sheet_url",
      Text: "text",
      Video: "video_id",
      RSS: "rss_url",
      Iframe: "iframe_url",
      Powerpoint: "powerpoint_url",
      Conversation: "webhookURL",
      ScriptEmbed: "scriptEmbed",
      QAForm: "webhookURL",
      Buttons: "webhookURL",
    };

    return type[typeState];
  }

  onUppy = (uppy) => {
    this.uppy = uppy;
  };

  getUploadProps() {
    const { pdf_path, image_path, type } = this.state;
    const block = this.state;
    let inputProps = {};
    const fileUploadButtonProps = {
      block,
      type,
      onUppy: this.onUppy,
      buttonProps: {
        className: "btn btn-primary d-block mx-auto",
      },
    };

    let onFileListDelete;

    switch (type) {
      case BlockTypes.Grid:
        fileUploadButtonProps.buttonProps.id = "upload_csv";
        break;
      case BlockTypes.Files:
        fileUploadButtonProps.buttonProps.id = "upload_files";
        break;
      case BlockTypes.PDF:
        fileUploadButtonProps.buttonProps.id = "upload_pdf";
        inputProps = {
          value: pdf_path,
          autoComplete: "off",
          id: "pdf_node",
          className: "form-control",
          label: "Path to PDF",
          onChange: this.handleChange,
        };
        onFileListDelete = this.handleRemoveFile;
        break;
      case BlockTypes.Image:
        fileUploadButtonProps.buttonProps.id = "upload_image";
        inputProps = {
          value: image_path,
          autoComplete: "off",
          id: "image_node",
          className: "form-control",
          label: "Path to Image",
          onChange: this.handleChange,
        };

        onFileListDelete = this.handleRemoveFile;
        break;
      default:
    }

    return {
      block,
      fileUploadButtonProps,
      handleUrlUploadChange: this.handleUrlUploadChange,
      inputProps,
      onFileListDelete,
    };
  }

  handleCloseAlert = () => {
    this.setState({ isAlertOpen: false });
  };

  handleEditorChange = (value) => {
    this.setState({ text: value });
  };

  handleEditorUploadSuccess = (uppyFiles) => {
    this.handleUrlUploadChange(uppyFiles);
  };

  // NOT USING THIS YET
  // handleEditorImageRemoved = (imageBlot) => {
  //   const blotValue = imageBlot.value();

  //   this.setState((state) => {
  //     const { textEditorFiles: prevTextEditorFiles } = state;
  //     const textEditorFiles = prevTextEditorFiles.filter((file) => {
  //       return file.filePath !== blotValue.image.src;
  //     });

  //     return { textEditorFiles };
  //   });
  // };

  // handleTextEditorRef = (reactQuill) => {
  //   if (reactQuill) {
  //     const editor = reactQuill.getEditor();
  //     editor.on("image-removed", this.handleEditorImageRemoved);
  //   }
  // };

  handleRemoveFile = (removeFile) => {
    const { type } = this.state;

    switch (type) {
      case BlockTypes.PDF:
        this.setState({
          pdf_path: "",
          pdfFiles: [],
        });
        break;
      case BlockTypes.Image:
        this.setState({
          image_path: "",
          imageFiles: [],
        });
        break;
      case BlockTypes.Files:
        {
          const { files } = this.state;
          const newFiles = files.filter((file) => file !== removeFile);
          this.setState({ files: newFiles });
        }
        break;
      case BlockTypes.Grid:
        {
          const { gridFiles } = this.state;
          const newFiles = gridFiles.filter((file) => file !== removeFile);
          this.setState({ gridFiles: newFiles });
        }
        break;
      default:
        break;
    }
  };

  makeNewCustomButton = () => {
    const newButton = {
      id: createUUID(),
      ...customButtonProps.Custom,
    };

    return newButton;
  };

  addCustomButton = () => {
    const newButton = this.makeNewCustomButton();

    this.setState((prevState) => ({
      buttons: [...prevState.buttons, newButton],
    }));
  };

  removeCustomButton = (buttonID) => {
    this.setState((prevState) => {
      const { buttons } = prevState;
      const newButtons = _filter(buttons, (currentButton) => {
        return currentButton.id !== buttonID;
      });

      return {
        buttons: newButtons,
      };
    });
  };

  handleButtonChange = (changedButton) => {
    this.setState((prevState) => {
      const { buttons } = prevState;
      const selectedButtonIndex = buttons.findIndex(
        (button) => button.id === changedButton.id
      );

      if (selectedButtonIndex === -1) {
        return prevState;
      }

      const newButtons = [...buttons];
      newButtons[selectedButtonIndex] = {
        ...buttons[selectedButtonIndex],
        ...changedButton,
      };

      return {
        buttons: newButtons,
        openButtonId: "",
      };
    });
  };

  addChecklistItem() {
    const placeHolderData = {
      id: createUUID(),
      text: "item",
    };

    this.setState((prevState) => ({
      data: [...prevState.data, placeHolderData],
    }));
  }

  addQAItem() {
    const placeHolderData = {
      id: createUUID(),
      question: "",
      answer: "",
    };

    this.setState((prevState) => ({
      qa_data: [...prevState.qa_data, placeHolderData],
    }));
  }

  async deleteItem() {
    const { sendData, confirm, mode } = this.props;

    try {
      if (mode !== "delete") {
        let deleteMessage = "";
        const blockFiles = getBlockFiles(this.state);

        if (blockFiles && blockFiles.length) {
          deleteMessage = <FileDeleteWarning files={blockFiles} />;
        }

        await confirm({
          title: "Are you sure you want to delete this Block?",
          description: deleteMessage,
          confirmationText: "Delete",
        });
      }

      firebase
        .database()
        .ref(this.dbPath)
        .remove(() => {
          sendData(this.state, "remove");
        });
    } catch (e) {
      // Cancelling a confirmation dialog results in a rejected Promise, but said rejection always returns `undefined`, whereas
      // other exceptions or rejected Promises will usually be an object of some sort.
      if (e) {
        throw e;
      }
    }
  }

  handleChecklistKeyDown = (event) => {
    if (event.key === "Enter" && event.shiftKey === false) {
      event.preventDefault();
      event.stopPropagation();

      this.addChecklistItem();
    }
  };

  handleQAItemChange(event, dataid, isAnswer) {
    const { qa_data } = this.state;
    const { value } = event.target;
    const newQAArray = [...qa_data];
    const index = _findIndex(newQAArray, { id: dataid });

    if (isAnswer) newQAArray[index] = { ...newQAArray[index], answer: value };
    else newQAArray[index] = { ...newQAArray[index], question: value };

    this.setState({ qa_data: newQAArray });
  }

  handleChange(event, dataid) {
    const { data } = this.state;
    const { id, value } = event.target;
    const newArray = [...data];
    let index;

    if (event.target.name === "Block Title") {
      this.setState({ blockTitle: value });
    } else if (id.includes("checklist_")) {
      index = _findIndex(newArray, { id: dataid });
      newArray[index] = { ...newArray[index], [event.target.name]: value };
      this.setState({ data: newArray });
    } else {
      this.setState({ [this.getTypeState()]: value });
    }
  }

  handleUrlUploadChange(uppyFiles) {
    if (!uppyFiles || !uppyFiles.length) {
      return;
    }

    const { user } = this.context;
    const newFiles = uppyFiles.map((uppyFile) => {
      const fileObj = uppyFileToWhatboardFile(uppyFile, user);

      return fileObj;
    });

    const filesProp = getBlockFilesProp(this.state);
    const urlProp = getBlockUrlProp(this.state);

    if (urlProp && filesProp) {
      this.setState({ [urlProp]: newFiles[0].filePath, [filesProp]: newFiles });
    } else if (filesProp) {
      this.setState((state) => {
        const { [filesProp]: prevFiles } = state;
        return { [filesProp]: [...prevFiles, ...newFiles] };
      });
    }
  }

  removeChecklistItem(itemID) {
    const { data } = this.state;
    const newData = _filter(data, (currentData) => {
      return currentData.id !== itemID;
    });

    this.setState({ data: newData });
  }

  removeQAItem(e, itemID) {
    const { qa_data } = this.state;
    const newData = _filter(qa_data, (currentData) => {
      return currentData.id !== itemID;
    });

    this.setState({ qa_data: newData });
  }

  onSubmit = async (event) => {
    event.persist();
    event.preventDefault();

    this.setState({
      isSubmitting: true,
    });

    try {
      if (this.uppy && getBlockFilesProp(this.state)) {
        await this.uppy.upload();
      }

      await this.saveModal(event);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      this.setState({
        isAlertOpen: true,
        errorMessage: error.message,
      });
    } finally {
      this.setState({
        isSubmitting: false,
      });
    }
  };

  async saveModal(e) {
    e.preventDefault();

    const {
      webhookURL,
      video_id,
      pdf_path,
      sheet_url,
      image_path,
      imageLink,
      useIframely,
      useWebhook,
      useQAWebhook,
      useButtonWebhook,
      isFireMyActions,
      rss_url,
      blockTitle,
      type,
      powerpoint_url,
      text,
      qa_data,
      qaEmailBoardOwner,
      color,
      files,
      gridFiles,
      imageFiles,
      pdfFiles,
      board_id,
      id,
      isNew,
      isPrivateTextBlock,
      isTransparentTextBlock,
      data,
      buttons,
      scriptEmbed,
      submitButtonClicked,
      fileRequestSettings,
    } = this.state;

    const saveAndNew = submitButtonClicked;
    const {
      sendData,
      created_by,
      type: prevType,
      iframe_url: prevIframeUrl,
    } = this.props;
    const { user } = this.context;
    const loggedInwbid = user.wbid;
    let { textEditorFiles, iframe_url } = this.state;
    let bTitle = blockTitle;
    let databaseUpdates = {};

    if (containsDataForBlockType(type, this.state)) {
      this.setState((prevState) => ({
        isAlertOpen: true,
        errorMessage: containsDataForBlockType(type, prevState),
      }));
      return;
    }

    if (type === BlockTypes.Text) {
      textEditorFiles = textEditorFiles.filter((file) => {
        return text.includes(_escape(file.filePath));
      });
    }

    if (typeof bTitle !== "string") {
      bTitle = "";
    } else {
      bTitle = bTitle.trim();
    }

    // This could prob be removed
    if (bTitle === "" || bTitle.toLowerCase() === "title") {
      bTitle = blockTypeLabels[type];
    }

    let updates = {
      isNew,
      id,
      board_id,
      type,
      created_by,
      color,
      title: bTitle,
    };

    if (type !== prevType) {
      const defaultState = _pick(blockDefaults, Object.keys(this.state));
      updates = {
        ..._cloneDeep(defaultState),
        ...updates,
      };
    }

    if (iframe_url !== prevIframeUrl) {
      iframe_url = await httpToHttps(iframe_url);
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
          data,
        };
        break;
      case type === BlockTypes.Text:
        updates = {
          ...updates,
          text,
          isPrivateTextBlock,
          isTransparentTextBlock,
          textEditorFiles,
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

    updates.isNew = false;

    const { clone, files: extractedFiles } = extractFiles(updates);
    const cloneUrlProp = getBlockUrlProp(clone);

    // If there are files to upload and the Block type has a URL prop
    // (i.e. `pdf_path` from PDF Blocks, `image_path` for Image Blocks)
    // then the URL prop will likely be set to a Blob URL or something else
    // that shouldn't be saved to the DB. So if possible, we revert back to
    // the previous value for the URL prop. This provides a better UX for
    // collaborators of the board who aren't the uploader. The URL prop will
    // be updated appropriately after the new files have been successfully uploaded.
    // For files without a URL prop (usually those that allow multiple files,
    // like Files Blocks and Text Blocks with images), we can't do this because
    // we need to account for removals from the files list, which should always
    // be processed.
    if (cloneUrlProp && extractedFiles.size) {
      if (clone.type === prevType) {
        const filesProp = getBlockFilesProp(clone);
        const {
          [cloneUrlProp]: prevFileUrl,
          [filesProp]: prevFiles,
        } = this.props;
        clone[cloneUrlProp] = prevFileUrl || "";
        clone[filesProp] = prevFiles || [];
      } else {
        clone[cloneUrlProp] = "";
      }
    }

    await firebase.database().ref(this.dbPath).update(clone);
    databaseUpdates = makeBoardBlockMetadataUpdate(board_id, id, loggedInwbid);
    await firebase.database().ref().update(databaseUpdates);

    sendData(
      {
        ...this.state,
        ...clone,
        blockTitle: bTitle,
        isNew: false,
        extractedFiles,
      },
      saveAndNew
    );
  }

  hideModal() {
    const { sendData } = this.props;

    sendData({ ...this.state }, "cancel");
  }

  handleTest = () => {
    this.setState((prevState) => ({
      isPrivateTextBlock: !prevState.isPrivateTextBlock,
    }));
  };

  handleTransparentTextBlockChange = () => {
    this.setState((prevState) => ({
      isTransparentTextBlock: !prevState.isTransparentTextBlock,
    }));
  };

  expandDescription = (id) => {
    this.setState({
      expandDescription: {
        id,
        expanded: true,
      },
    });
  };

  renderColorPicker = () => {
    let circlePicker = null;
    const { displayColorPicker, color } = this.state;
    if (displayColorPicker) {
      circlePicker = (
        <div className="color-popover">
          <div
            className="color-cover"
            role="none"
            onClick={this.handleCloseColorPicker}
          />
          <CirclePicker
            className="color-picker"
            colors={blockColors}
            color={color}
            onClick={this.handleOpenColorPicker}
            onChangeComplete={this.handleColorChange}
          />
        </div>
      );
    }
    const content = (
      <>
        <span className="color-picker-label">Color</span>
        <IconButton
          style={{ backgroundColor: color }}
          className="color-picker-button"
          onClick={this.handleOpenColorPicker}
        />
        {circlePicker}
      </>
    );

    return content;
  };

  renderInput() {
    let content = null;
    const { type } = this.state;
    const inputProps = this.getInputProps();

    if (type === "Data") {
      content = <TextField {...inputProps} />;
    }

    if (
      type === BlockTypes.Spreadsheet ||
      type === BlockTypes.RSS ||
      type === BlockTypes.Powerpoint ||
      type === BlockTypes.Iframe ||
      type === BlockTypes.Video
    ) {
      delete inputProps.type;

      content = <UrlField {...inputProps} />;
    }

    return content;
  }

  renderScriptEmbedField = () => {
    let content = null;
    const { type, scriptEmbed } = this.state;

    if (type === BlockTypes.ScriptEmbed) {
      content = (
        <TextField
          variant="outlined"
          multiline
          InputProps={{
            rowsMin: 3,
          }}
          value={scriptEmbed}
          onChange={this.handleChange}
          label="Paste script embed snippet below"
        />
      );
    }

    return content;
  };

  renderIframelyCheckBox = () => {
    let content = null;
    const { type, useIframely } = this.state;

    if (type === BlockTypes.Iframe) {
      const label = (
        <Stack
          component="span"
          direction="row"
          alignItems="center"
          spacing={1}
          display="inline-flex"
        >
          <span>Use Iframely</span>
          <Tooltip title="Ideal for Twitter, Facebook &amp; hard-to-embed sites">
            <HelpIcon fontSize="small" />
          </Tooltip>
        </Stack>
      );

      content = (
        <FormControlLabel
          control={
            <Checkbox
              checked={useIframely}
              onChange={(e) => this.setState({ useIframely: e.target.checked })}
              name="iframely_checkbox"
            />
          }
          label={label}
        />
      );
    }

    return content;
  };

  handleConvertToButtonBlock = () => {
    const newButton = this.makeNewCustomButton();
    const typeState = this.getTypeState();
    const { state } = this;

    newButton.url = state[typeState];

    this.setState({
      buttons: [newButton],
      type: BlockTypes.Buttons,
      openButtonId: newButton.id,
    });
  };

  renderConvertToButtonBlockButton = () => {
    let content = null;
    const { type } = this.state;

    if (type === BlockTypes.Iframe) {
      content = (
        <Tooltip
          title="Use this when the URL you are trying to embed cannot be displayed using this Block type"
          placement="top"
        >
          <Button
            onClick={this.handleConvertToButtonBlock}
            type="button"
            className="neutral-button"
            startIcon={<HelpIcon />}
          >
            Convert to Button Block
          </Button>
        </Tooltip>
      );
    }

    return content;
  };

  renderConversationForm = () => {
    let content = null;
    const { type, webhookURL, useWebhook, isFireMyActions } = this.state;
    if (type === BlockTypes.Conversation && useWebhook) {
      content = (
        <>
          <FormControlLabel
            label="Use Webhook"
            control={
              <Checkbox
                checked={useWebhook}
                onChange={(e) =>
                  this.setState({ useWebhook: e.target.checked })
                }
                name="iframely_checkbox"
              />
            }
          />

          <FormControlLabel
            label="Fire on my actions"
            control={
              <Checkbox
                checked={isFireMyActions}
                onChange={(e) =>
                  this.setState({ isFireMyActions: e.target.checked })
                }
                name="iframely_checkbox"
              />
            }
          />

          <UrlField
            value={webhookURL}
            label="Webhook URL"
            onChange={this.handleChange}
          />
          <br />
          <Accordion>
            <AccordionSummary aria-controls="panel1a-content">
              <Typography>How to use Webhook URL</Typography>
            </AccordionSummary>
            <AccordionDetails className="accordion-modal-details">
              <p className="modal-note">
                On each new message, Whatboard will perform a{" "}
                <strong>HTTP POST</strong> request to this webhook URL.
              </p>
              <p>Payload Format:</p>
              <pre className="modal-pre">
                {"{"}
                <br />
                {"    "}board_id: String,
                <br />
                {"    "}board_title: String,
                <br />
                {"    "}board_owner: String,
                <br />
                {"    "}block_id: String,
                <br />
                {"    "}block_title: String,
                <br />
                {"    "}webhookURL: String,
                <br />
                {"    "}new_message: String,
                <br />
                {"    "}message_sender: String,
                <br />
                {"    "}message_sender_name: String,
                <br />
                {"    "}timestamp: String (ISO-8859-1 Format)
                <br />
                {"}"}
              </pre>
            </AccordionDetails>
          </Accordion>
        </>
      );
    } else if (type === BlockTypes.Conversation && !useWebhook) {
      content = (
        <FormControlLabel
          label="Use Webhook"
          control={
            <Checkbox
              checked={useWebhook}
              onChange={(e) => this.setState({ useWebhook: e.target.checked })}
              name="iframely_checkbox"
            />
          }
        />
      );
    }

    return content;
  };

  renderPrivateTextBlockCheckbox() {
    const { isPrivateTextBlock } = this.state;

    const label = (
      <Stack
        component="span"
        direction="row"
        alignItems="center"
        spacing={1}
        display="inline-flex"
      >
        <span>Make Private</span>
        <Tooltip title="If checked this block will be private, only visible to you.">
          <HelpIcon fontSize="small" />
        </Tooltip>
      </Stack>
    );

    return (
      <div>
        <FormControlLabel
          control={
            <Checkbox checked={isPrivateTextBlock} onChange={this.handleTest} />
          }
          label={label}
        />
      </div>
    );
  }

  renderTransparentTextBlockCheckbox() {
    const { isTransparentTextBlock } = this.state;

    return (
      <div>
        <FormControlLabel
          control={
            <Checkbox
              checked={isTransparentTextBlock}
              onChange={this.handleTransparentTextBlockChange}
            />
          }
          label="Transparent Background"
        />
      </div>
    );
  }

  renderEditor() {
    const { type, text } = this.state;
    let content = null;
    if (type === BlockTypes.Text) {
      content = (
        <div className="html-editor">
          <FormGroup>
            {this.renderPrivateTextBlockCheckbox()}
            {this.renderTransparentTextBlockCheckbox()}
          </FormGroup>
          <TextEditor
            // ref={this.handleTextEditorRef}
            block={this.state}
            defaultValue={text}
            value={text}
            className="html-editor--editor"
            data-text-editor="html-editor"
            onChange={this.handleEditorChange}
            onUploadSuccess={this.handleEditorUploadSuccess}
          />
        </div>
      );
    }

    return content;
  }

  renderCheckList() {
    let content = null;
    const { type, data: dataState, expandDescription } = this.state;

    if (type === BlockTypes.Checklist) {
      content = (
        <>
          <div className="checklist_inputs">
            {dataState.map((data) => {
              return (
                <div
                  key={`checklist_${data.id}`}
                  className="checklist_input_item"
                >
                  <TextField
                    className="checklist_text"
                    onChange={(e) => this.handleChange(e, data.id)}
                    type="text"
                    value={data.text}
                    variant="outlined"
                    name="text"
                    id={`checklist_${data.id}`}
                    onKeyPress={this.handleChecklistKeyDown}
                  />
                  {!(expandDescription?.id === data.id || data.description) && (
                    <span
                      className="checklist_text-add-description"
                      onClick={() => this.expandDescription(data.id)}
                      onKeyDown={this.expandDescription}
                      role="button"
                      tabIndex="-1"
                    >
                      Add Description
                    </span>
                  )}
                  {(expandDescription?.id === data.id || data.description) && (
                    <TextField
                      onChange={(e) => this.handleChange(e, data.id)}
                      type="text"
                      label="Description"
                      className="checklist_text checklist_text-description"
                      multiline
                      variant="outlined"
                      name="description"
                      rows={4}
                      value={data.description}
                      id={`checklist_${data.id} outlined-multiline-static`}
                      onKeyPress={this.handleChecklistKeyDown}
                    />
                  )}
                  <IconButton
                    onClick={() => this.removeChecklistItem(data.id)}
                    className="blockmodal-checklist-remove"
                    size="small"
                  >
                    <Clear />
                  </IconButton>
                </div>
              );
            })}
          </div>
          <Button
            onSubmit={this.addChecklistItem}
            size="small"
            className="blockmodal-checklist-add"
            tabIndex="0"
            onClick={this.addChecklistItem}
            variant="outlined"
            startIcon={<Add />}
          >
            Add new item
          </Button>
        </>
      );
    }

    return content;
  }

  handleOpenColorPicker = () => {
    const { displayColorPicker } = this.state;
    this.setState({ displayColorPicker: !displayColorPicker });
  };

  handleCloseColorPicker = () => {
    this.setState({ displayColorPicker: false });
  };

  renderQAForm() {
    let content = null;
    const {
      type,
      qa_data: dataState,
      useQAWebhook,
      webhookURL,
      qaEmailBoardOwner,
    } = this.state;

    if (type === BlockTypes.QAForm) {
      content = (
        <>
          <FormControlLabel
            label="Email Responses to Board Owner"
            control={
              <Checkbox
                checked={qaEmailBoardOwner}
                onChange={(e) => {
                  this.setState({ qaEmailBoardOwner: e.target.checked });
                }}
              />
            }
          />
          <FormControlLabel
            label="Use Webhook"
            control={
              <Checkbox
                checked={useQAWebhook}
                onChange={(e) =>
                  this.setState({ useQAWebhook: e.target.checked })
                }
                name="iframely_checkbox"
              />
            }
          />
          {useQAWebhook && (
            <>
              <UrlField
                value={webhookURL}
                label="Webhook URL"
                onChange={this.handleChange}
              />
              <br />
              <Accordion>
                <AccordionSummary aria-controls="panel1a-content">
                  <Typography>How to use Webhook URL</Typography>
                </AccordionSummary>
                <AccordionDetails className="accordion-modal-details">
                  <p className="modal-note">
                    On each new message, Whatboard will perform a{" "}
                    <strong>HTTP POST</strong> request to this webhook URL.
                  </p>
                  <p>Payload Format:</p>
                  <pre className="modal-pre">
                    {"{"}
                    <br />
                    {"    "}board_id: String,
                    <br />
                    {"    "}board_title: String,
                    <br />
                    {"    "}board_owner: String,
                    <br />
                    {"    "}block_id: String,
                    <br />
                    {"    "}block_title: String,
                    <br />
                    {"    "}webhookURL: String,
                    <br />
                    {"    "}question: String,
                    <br />
                    {"    "}answer: String,
                    <br />
                    {"    "}timestamp: String (ISO-8859-1 Format)
                    <br />
                    {"}"}
                  </pre>
                </AccordionDetails>
              </Accordion>
              <br />
            </>
          )}

          <div>
            {dataState.map((data) => {
              return (
                <div key={`qa_${data.id}`} className="qainput-item">
                  <div className="qainput-item-header">
                    <TextField
                      className="qainput-item-header-title"
                      onChange={(e) =>
                        this.handleQAItemChange(e, data.id, false)
                      }
                      type="text"
                      placeholder="Add a question"
                      required
                      value={data.question}
                      id={`qa_${data.id}`}
                    />
                    <DeleteOutlineIcon
                      onClick={(e) => this.removeQAItem(e, data.id)}
                      onKeyDown={() => {}}
                      role="button"
                      tabIndex="0"
                      className="del_item"
                    />
                  </div>
                  <TextField
                    multiline
                    className="qainput-item-answer full-width-form"
                    autoComplete="off"
                    placeholder="Recipient will answer here"
                    rows={3}
                    value={data.answer}
                    onChange={(e) => this.handleQAItemChange(e, data.id, true)}
                  />
                </div>
              );
            })}
          </div>
          <Button
            onClick={this.addQAItem}
            type="button"
            className="neutral-button qa-add-button"
          >
            Click to add another question
          </Button>
        </>
      );
    }

    return content;
  }

  renderFiles() {
    let content = null;
    const { type, files, gridFiles } = this.state;

    if (type === BlockTypes.Files || type === BlockTypes.Grid) {
      content = (
        <>
          <div>
            <UrlOrUpload {...this.getUploadProps()}>Upload Files</UrlOrUpload>
          </div>
          <FileList
            files={type === BlockTypes.Grid ? gridFiles : files}
            isRemovable
            handleRemoveFile={this.handleRemoveFile}
          />
        </>
      );
    }

    return content;
  }

  renderButtons() {
    let content = null;
    const {
      type,
      buttons,
      useButtonWebhook,
      webhookURL,
      openButtonId,
    } = this.state;

    if (type === BlockTypes.Buttons) {
      content = (
        <>
          <FormControlLabel
            label="Use Webhook"
            control={
              <Checkbox
                checked={useButtonWebhook}
                onChange={(e) =>
                  this.setState({ useButtonWebhook: e.target.checked })
                }
                name="iframely_checkbox"
              />
            }
          />
          {useButtonWebhook && (
            <>
              <UrlField
                value={webhookURL}
                label="Webhook URL"
                onChange={this.handleChange}
              />
              <br />
              <Accordion>
                <AccordionSummary aria-controls="panel1a-content">
                  <Typography>How to use Webhook URL</Typography>
                </AccordionSummary>
                <AccordionDetails className="accordion-modal-details">
                  <p className="modal-note">
                    On each new message, Whatboard will perform a{" "}
                    <strong>HTTP POST</strong> request to this webhook URL.
                  </p>
                  <p>Payload Format:</p>
                  <pre className="modal-pre">
                    {"{"}
                    <br />
                    {"    "}board_id: String,
                    <br />
                    {"    "}board_title: String,
                    <br />
                    {"    "}board_owner: String,
                    <br />
                    {"    "}block_id: String,
                    <br />
                    {"    "}block_title: String,
                    <br />
                    {"    "}webhookURL: String,
                    <br />
                    {"    "}user_who_clicked: String,
                    <br />
                    {"    "}button_type: String,
                    <br />
                    {"    "}button_title: String,
                    <br />
                    {"    "}button_link: String,
                    <br />
                    {"    "}timestamp: String (ISO-8859-1 Format)
                    <br />
                    {"}"}
                  </pre>
                </AccordionDetails>
              </Accordion>
              <br />
            </>
          )}
          <div className="button-list">
            {buttons.map((button) => {
              const popupId = `button_${button.id}`;

              const makePopoverProps = (popupState) => {
                const popoverProps = bindPopover(popupState);
                const oldOnClose = popoverProps.onClose;

                popoverProps.onClose = (...args) => {
                  oldOnClose(...args);
                  this.setState({
                    openButtonId: "",
                  });
                };

                return popoverProps;
              };

              return (
                <div key={popupId} className="button-container">
                  <PopupState variant="popover" popupId={popupId}>
                    {(popupState) => (
                      <>
                        <CustomButton
                          button={button}
                          {...bindTrigger(popupState)}
                          ref={(elem) => {
                            if (
                              elem &&
                              openButtonId &&
                              button.id === openButtonId
                            ) {
                              popupState.open(elem);
                            }
                          }}
                        />

                        <Popover
                          {...makePopoverProps(popupState)}
                          anchorOrigin={{
                            vertical: "center",
                            horizontal: "center",
                          }}
                          transformOrigin={{
                            vertical: "center",
                            horizontal: "center",
                          }}
                        >
                          <ButtonOptionPanel
                            currentButton={button}
                            handleChange={(changedButton) => {
                              this.handleButtonChange(changedButton);
                              popupState.close();
                            }}
                          />
                        </Popover>
                      </>
                    )}
                  </PopupState>
                  <Clear
                    onClick={() => this.removeCustomButton(button.id)}
                    onKeyDown={() => {}}
                    role="button"
                    tabIndex="0"
                    className="del_item"
                  />
                </div>
              );
            })}
            <Add
              onClick={this.addCustomButton}
              onKeyDown={() => {}}
              className="right"
              role="button"
              tabIndex="0"
            />
          </div>
        </>
      );
    }

    return content;
  }

  renderUrlOrUpload() {
    const content = [];
    const { type, imageLink } = this.state;
    const uploadText =
      type === BlockTypes.PDF ? "Upload a PDF" : "Upload an Image";

    if (type === BlockTypes.Image) {
      content.push(
        <UrlField
          key="image-link"
          value={imageLink}
          onChange={(e) => this.setState({ imageLink: e.target.value })}
          label="Web Page Link"
          helperText="When the image is clicked on, this web page will be opened in a new browser window/tab. Example: https://www.google.com"
        />
      );
      content.push(<br key="line-break" />);
    }

    if (type === BlockTypes.PDF || type === BlockTypes.Image) {
      content.push(
        <UrlOrUpload key="url-or-upload" {...this.getUploadProps()}>
          {uploadText}
        </UrlOrUpload>
      );
    }

    return content;
  }

  handleFileRequestNoteChange = (event) => {
    const { value } = event.target;

    this.setState((state) => {
      const newState = {
        fileRequestSettings: {
          ...state.fileRequestSettings,
          note: value,
        },
      };

      return newState;
    });
  };

  renderFileRequestSettingsNote() {
    const {
      fileRequestSettings: { note },
    } = this.state;

    return (
      <TextField
        label="Description"
        helperText="A short, helpful description of the file(s) you are requesting"
        multiline
        rows={3}
        value={note}
        onChange={this.handleFileRequestNoteChange}
      />
    );
  }

  renderFileRequestSettings() {
    let content = null;
    const { type } = this.state;

    if (type === BlockTypes.FileRequest) {
      content = this.renderFileRequestSettingsNote();
    }

    return content;
  }

  render() {
    const {
      blockTitle,
      type,
      isAlertOpen,
      errorMessage,
      isNew,
      isSubmitting,
    } = this.state;
    const { mode } = this.props;

    const deleteButton = (
      <Button
        className="cancel-button"
        onClick={this.deleteItem}
        type="button"
        disabled={isSubmitting}
      >
        Delete
      </Button>
    );

    const cancelButton = (
      <Button
        className="neutral-button"
        onClick={this.hideModal}
        type="button"
        disabled={isSubmitting}
      >
        {!isNew ? "Close" : "Cancel"}
      </Button>
    );

    const saveButton = (
      <Button
        type="submit"
        form="block-edit-form"
        className="confirm-button"
        onClick={() => this.setState({ submitButtonClicked: "save" })}
        disabled={isSubmitting}
      >
        Save
      </Button>
    );

    const saveAndNewButton = (
      <Button
        type="submit"
        form="block-edit-form"
        className="save-and-new-button"
        onClick={() => this.setState({ submitButtonClicked: "saveAndNew" })}
        disabled={isSubmitting}
      >
        Save &amp; Create new
      </Button>
    );

    const convertToButtonBlockButton = this.renderConvertToButtonBlockButton();

    let modalTitle = "Edit Block";
    let deleteMessage = "";

    if (mode === "delete") {
      modalTitle = "Are you sure you want to delete this block?";
      const blockFiles = getBlockFiles(this.state);

      if (blockFiles && blockFiles.length) {
        deleteMessage = <FileDeleteWarning files={blockFiles} />;
      }
    } else if (isNew) {
      modalTitle = "Add Block";
    }

    return (
      <Dialog
        open
        maxWidth="md"
        fullWidth
        onClose={this.hideModal}
        disableBackdropClick
      >
        <DialogTitle className="modal-dialog-title">
          <Stack
            component="span"
            direction="row"
            alignItems="center"
            spacing={1}
            display="inline-flex"
          >
            <span>{modalTitle}</span>
            {blockTypeGuides[type] && (
              <Tooltip
                title={
                  <span className="help-tooltip">{blockTypeGuides[type]}</span>
                }
              >
                <HelpIcon />
              </Tooltip>
            )}
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Snackbar
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
            open={isAlertOpen}
            autoHideDuration={2000}
            onClose={this.handleCloseAlert}
          >
            <Alert
              onClose={this.handleCloseAlert}
              variant="filled"
              severity="error"
            >
              {errorMessage}
            </Alert>
          </Snackbar>
          {mode === "delete" && deleteMessage}
          {mode === "edit" && (
            <>
              {this.renderColorPicker()}
              <br />
              <form id="block-edit-form" onSubmit={this.onSubmit}>
                <div className="type-selector">
                  <TextField
                    variant="outlined"
                    label="Block Type"
                    select
                    id="selected_type"
                    value={type}
                    onBlur={this.onBlockTypeChange}
                    onChange={this.onBlockTypeChange}
                    SelectProps={{
                      renderValue: (value) => blockTypesInfo[value].label,
                    }}
                  >
                    <BlockTypeMenuItem
                      blockType={BlockTypes.Text}
                      value={BlockTypes.Text}
                    />
                    <BlockTypeMenuItem
                      blockType={BlockTypes.PDF}
                      value={BlockTypes.PDF}
                    />
                    <BlockTypeMenuItem
                      blockType={BlockTypes.Image}
                      value={BlockTypes.Image}
                    />
                    <BlockTypeMenuItem
                      blockType={BlockTypes.Video}
                      value={BlockTypes.Video}
                    />
                    <BlockTypeMenuItem
                      blockType={BlockTypes.Files}
                      value={BlockTypes.Files}
                    />
                    <Divider />
                    <BlockTypeMenuItem
                      blockType={BlockTypes.Buttons}
                      value={BlockTypes.Buttons}
                    />
                    <BlockTypeMenuItem
                      blockType={BlockTypes.Checklist}
                      value={BlockTypes.Checklist}
                    />
                    <BlockTypeMenuItem
                      blockType={BlockTypes.Conversation}
                      value={BlockTypes.Conversation}
                    />
                    {/* <BlockTypeMenuItem blockType={BlockTypes.Spreadsheet} value={BlockTypes.Spreadsheet} /> */}
                    <BlockTypeMenuItem
                      blockType={BlockTypes.ScriptEmbed}
                      value={BlockTypes.ScriptEmbed}
                    />
                    <BlockTypeMenuItem
                      blockType={BlockTypes.Iframe}
                      value={BlockTypes.Iframe}
                    />
                    <BlockTypeMenuItem
                      blockType={BlockTypes.FileRequest}
                      value={BlockTypes.FileRequest}
                    />
                    <BlockTypeMenuItem
                      blockType={BlockTypes.QAForm}
                      value={BlockTypes.QAForm}
                    />
                    <BlockTypeMenuItem
                      blockType={BlockTypes.RSS}
                      value={BlockTypes.RSS}
                    />
                    <BlockTypeMenuItem
                      blockType={BlockTypes.Grid}
                      value={BlockTypes.Grid}
                    />
                    {/* <BlockTypeMenuItem blockType={BlockTypes.Powerpoint} value={BlockTypes.Powerpoint} /> */}
                  </TextField>
                  <br />
                  <TextField
                    label="Block Title"
                    name="Block Title"
                    autoComplete="off"
                    value={blockTitle}
                    onChange={this.handleChange}
                  />
                  <br />
                  {this.renderIframelyCheckBox()}
                  {this.renderInput()}
                  {this.renderScriptEmbedField()}
                  {this.renderEditor()}
                  {this.renderCheckList()}
                  {this.renderUrlOrUpload()}
                  {this.renderFiles()}
                  {this.renderQAForm()}
                  {this.renderButtons()}
                  {this.renderConversationForm()}
                  {this.renderFileRequestSettings()}
                  <br />
                </div>
              </form>
            </>
          )}
        </DialogContent>
        <DialogActions>
          {mode === "edit" && (
            <>
              {!isNew && deleteButton}
              {convertToButtonBlockButton}
              {cancelButton}
              {saveAndNewButton}
              {saveButton}
            </>
          )}
          {mode === "delete" && (
            <>
              {cancelButton}
              {deleteButton}
            </>
          )}
        </DialogActions>
      </Dialog>
    );
  }
}

BlockModal.contextType = UserContext;

const enhance = compose(withConfirm());

export default enhance(BlockModal);
