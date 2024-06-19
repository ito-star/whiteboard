/// FIGURE OUT  SHARE BLOCK
// SEND A PROP OR SOMETHING
// DO NOT RENDER THE BLOCK with  isPrivateTextBlock if you're not board owner.

import _set from "lodash/set";
import _forOwn from "lodash/forOwn";
import _get from "lodash/get";
import React from "react";
import hexToRgba from "hex-to-rgba";
import { connect } from "react-redux";
import { compose } from "redux";
import {
  WidthProvider,
  Responsive,
  utils as rglUtils,
} from "react-grid-layout";
import { withSnackbar } from "notistack";
import firebase from "firebase/compat/app";
import "firebase/compat/database";
import memoizeOne from "memoize-one";
import PropTypes from "prop-types";
import clsx from "clsx";
import Menu from "@material-ui/core/Menu";
import Portal from "@material-ui/core/Portal";
import MenuItem from "@material-ui/core/MenuItem";
import Divider from "@material-ui/core/Divider";
import ControlCameraIcon from "@material-ui/icons/ControlCameraOutlined";
import PinIcon from "mdi-material-ui/Pin";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import DropTarget from "@uppy/drop-target";
import UppySelectorUploader from "../UppySelectorUploader";
import UserContext from "../auth/UserContext";
import Block from "../Block";
import {
  BlockTypes,
  blockTypeLabels,
  getBlockDefaults,
  customButtonProps,
} from "../constant";
import {
  updateBoardMetadata,
  isBlockTypeEmpty,
  timeSort,
  extractFiles,
  getBlockUrlProp,
  createUUID,
} from "../utils";
import {
  makeUppyIdForBoard,
  getCommonOptions,
  makeRestrictionsForUser,
  allowedImageTypes,
  allowedPdfTypes,
  uppyFileToWhatboardFile,
} from "../uppy";
import "./Layout.scss";
import "@uppy/core/dist/style.css";
import "@uppy/drop-target/dist/style.css";
import "@uppy/dashboard/dist/style.css";
import access from "../access";
import BlockTypeMenuItem from "../BlockTypeMenuItem/BlockTypeMenuItem";
import withOnDatabaseEvent from "../withOnDatabaseEvent";
import BlockWelcomeScreen from "../BlockWelcomeScreen";
import Toolbar from "./Toolbar";
import Loader from "../components/Loader";
import withModal from "../withModal";
import NewBoardUiAnnoncement from "./NewBoardUiAnnoncement";

const Mousetrap = require("mousetrap");

const ResponsiveReactGridLayout = WidthProvider(Responsive);

const breakpoints = ["lg", "md", "sm", "xs", "xxs"];
const GRID_LG_COLS = 15;
const UPPY_ID_SUFFIX = "selector";

const baseGetItemsArray = (items) => {
  return Array.from(items.values());
};

const getItemsArray = memoizeOne(baseGetItemsArray);

/**
 * This layout demonstrates how to use a grid with a dynamic number of elements.

 */

class AddRemoveLayout extends React.PureComponent {
  constructor(props) {
    super(props);
    this.didDragEnd = this.didDragEnd.bind(this);
    this.handleDrag = this.handleDrag.bind(this);
    this.getBlockClasses = this.getBlockClasses.bind(this);
    this.onLayoutChange = this.onLayoutChange.bind(this);
    this.blockRef = React.createRef(null);
    this.state = {
      loaded: false,
      board_id: props.board_id,
      readOnlyBodyColor: props.readOnlyBodyColor,
      items: new Map(),
      prevPropsBeautify: props.beautify,
      prevPropsFreezeAll: props.freezeAll,
      readOnly: props.readOnly,
      mouseX: null,
      mouseY: null,
      isMenuLoadMore: false,
      isUppyDashboardOpen: false,
      fullViewId: null,
      fullViewPageNumber: 1,
    };

    if (!props.readOnly) {
      const uppyOptions = {
        ...getCommonOptions(),
        id: makeUppyIdForBoard(props.board_id, UPPY_ID_SUFFIX),
      };

      this.uppy = new Uppy(uppyOptions);

      this.uppy.use(UppySelectorUploader, {});
      this.uppy.on("files-added", this.handleFilesAdded);
      this.uppy.on("complete", this.handleUploadComplete);

      this.extractedFiles = new Map();
      this.createBlockRef = React.createRef(null);
    }

    this.onBreakpointChange = this.onBreakpointChange.bind(this);
    this.renderLayoutItems = memoizeOne(this.renderLayoutItems);
    this.renderElements = memoizeOne(this.renderElements);
  }

  static getDerivedStateFromProps(props, state) {
    let newState = {};
    if (props.freezeAll !== state.prevPropsFreezeAll) {
      const updates = {};
      Array.from(state.items.values()).forEach((item) => {
        updates[`blocks/${state.board_id}/${item.id}/static`] = props.freezeAll;
      });
      updates[`whiteboards/${state.board_id}/isBoardFrozen`] = props.freezeAll;
      firebase.database().ref().update(updates);
      newState = {
        ...newState,
        prevPropsFreezeAll: props.freezeAll,
      };
    } else if (props.beautify !== state.prevPropsBeautify && !props.freezeAll) {
      const updates = {};
      const standardWidth = 3;
      const standardHeight = 5;
      const blocks = timeSort(Array.from(state.items.values()));

      blocks.forEach((item, i) => {
        if (isBlockTypeEmpty(item, item.type)) {
          updates[`blocks/${state.board_id}/${item.id}`] = null;
        } else {
          updates[
            `blocks/${state.board_id}/${item.id}/grid/lg/w`
          ] = standardWidth;
          updates[
            `blocks/${state.board_id}/${item.id}/grid/lg/h`
          ] = standardHeight;
          updates[`blocks/${state.board_id}/${item.id}/grid/lg/x`] =
            (i * standardWidth) % GRID_LG_COLS;
          updates[`blocks/${state.board_id}/${item.id}/grid/lg/y`] =
            Math.floor((i * standardWidth) / GRID_LG_COLS) * standardHeight;
        }
      });
      firebase.database().ref().update(updates);
      newState = {
        ...newState,
        prevPropsBeautify: props.beautify,
      };
    }

    return newState === {} ? null : newState;
  }

  componentDidMount() {
    const { board_id } = this.state;
    const { readOnly, enqueueSnackbar, onDatabaseEvent } = this.props;
    const ref = firebase.database().ref(`blocks/${board_id}`);
    const boardFullViewRef = firebase
      .database()
      .ref(`whiteboards/${board_id}/fullViewId`);
    const boardFullViewPageNumberRef = firebase
      .database()
      .ref(`whiteboards/${board_id}/fullViewPageNumber`);

    const processBlocks = (snap) => {
      try {
        const blocks = new Map();
        snap.forEach((blockSnap) => {
          const block = this.hydrateBlock(blockSnap);
          blocks.set(block.id, block);
        });

        this.setState({
          items: blocks,
          loaded: true,
        });
      } catch {
        this.setState({ loaded: true });
      }
    };

    const handleError = (error) => {
      // eslint-disable-next-line no-console
      console.log(error);

      enqueueSnackbar(error, {
        variant: "error",
      });
    };

    if (!readOnly) {
      Mousetrap.bind("alt+n", () => {
        this.onAddItem(BlockTypes.Text);
      });

      onDatabaseEvent(ref, "value", processBlocks, handleError);
      this.renderNewBoardUiAnnouncement();
    }

    onDatabaseEvent(boardFullViewRef, "value", (snap) => {
      this.setState({ fullViewId: snap.val() });
    });

    onDatabaseEvent(boardFullViewPageNumberRef, "value", (snap) => {
      this.setState({ fullViewPageNumber: snap.val() });
    });

    if (readOnly) {
      ref.once("value", processBlocks, handleError);
    }

    if (this.uppy) {
      this.updateUppyOptions();
      this.uppy.use(DropTarget, {
        target: "#root",
      });
    }
  }

  componentDidUpdate() {
    this.updateUppyOptions();
  }

  componentWillUnmount() {
    if (this.uppy) {
      this.uppy.close();
    }
  }

  hydrateBlock(blockSnap) {
    const blockData = blockSnap.val();
    const block = {
      ...getBlockDefaults(),
      ...blockData,
      grid: {
        ...blockData.grid,
        xxs: {
          ...blockData?.grid?.xxs,
          h: 5,
        },
      },
      isFocus: false,
    };

    if (block.type === BlockTypes.Buttons) {
      // Make sure custom buttons have all of the necessary props
      // There is a chance that they could have been saved without an ID
      block.buttons = block.buttons.map((button) => {
        const buttonType = button.type || customButtonProps.Custom.type;
        const newButton = {
          id: createUUID(),
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

    if (this.extractedFiles instanceof Map) {
      const extractedFiles = this.extractedFiles.get(block.id);

      if (extractedFiles) {
        this.extractedFiles.delete(block.id);

        extractedFiles.forEach((paths, file) => {
          paths.forEach((path) => {
            _set(block, path, file);
          });
        });
      }
    }

    return block;
  }

  handleFilesAdded = () => {
    this.setState({ isUppyDashboardOpen: true });
  };

  handleRequestClose = () => {
    this.setState({ isUppyDashboardOpen: false });
  };

  handleUploadComplete = (result) => {
    if (!this.uppy) {
      return;
    }

    const { user } = this.context;
    const imageFiles = [];
    const pdfFiles = [];
    const otherFiles = [];

    result.successful.forEach((file) => {
      this.uppy.removeFile(file.id);
      const wbFile = uppyFileToWhatboardFile(file, user);

      if (allowedImageTypes.includes(wbFile.fileType)) {
        imageFiles.push(wbFile);
      } else if (allowedPdfTypes.includes(wbFile.fileType)) {
        pdfFiles.push(wbFile);
      } else {
        otherFiles.push(wbFile);
      }
    });

    imageFiles.forEach((imageFile) => {
      this.onAddItem(
        BlockTypes.Files,
        [imageFile],
        null,
        undefined,
        false,
        true
      );
    });

    pdfFiles.forEach((pdfFile) => {
      this.onAddItem(BlockTypes.Files, [pdfFile], null, undefined, false, true);
    });

    if (otherFiles.length) {
      this.onAddItem(
        BlockTypes.Files,
        otherFiles,
        null,
        undefined,
        false,
        true
      );
    }
  };

  updateUppyOptions = () => {
    if (!this.uppy) {
      return;
    }

    const { board_id } = this.state;
    const { user } = this.context;

    const uppyOptions = {
      id: makeUppyIdForBoard(board_id, UPPY_ID_SUFFIX),
      restrictions: {
        ...makeRestrictionsForUser(user),
        minNumberOfFiles: 1,
      },
    };

    const uppyMeta = {
      uploaderUid: user.uid,
      uploaderWbid: user.wbid,
    };

    const currentMeta = this.uppy.getState().meta;

    this.uppy.setOptions(uppyOptions);

    if (
      currentMeta.uploaderUid !== uppyMeta.uploaderUid ||
      currentMeta.uploaderWbid !== uppyMeta.uploaderWbid
    ) {
      this.uppy.setMeta(uppyMeta);
    }
  };

  makeReactKey(block) {
    // return `${block.id}:::${_get(block, "metadata.lastModified")}`;
    return block.id;
  }

  getBlockIdFromReactKey(key) {
    // const parts = key.split(":::", 2);
    // return parts[0];
    return key;
  }

  onAddItem = (
    blockType,
    files = [],
    block_id = null,
    onComplete,
    isNew = true,
    isUppyUpload = false
  ) => {
    const { board_id, items, cols } = this.state;
    const { compactType } = this.props;
    const { user } = this.context;
    const { wbid } = user;
    const blockDefaults = getBlockDefaults();
    let ref;
    let newBlockType = blockType;
    let newFiles = files;
    let { image_path, pdf_path, imageFiles, pdfFiles } = blockDefaults;
    const { gridFiles } = blockDefaults;
    let newItems;
    let newBlock;

    if (blockType === "Clone") {
      const cloneBlock = items.get(block_id);
      ref = firebase.database().ref(`blocks/${board_id}`).push();
      newItems = new Map(items);
      newBlock = {
        ...cloneBlock,
        id: ref.key,
        date_created: new Date().toJSON(),
        x: (Array.from(items.values()).length * 2) % (cols || GRID_LG_COLS),
        y: compactType === "vertical" ? 1000 : 0, // puts it at the bottom,
      };
    } else {
      if (block_id) {
        ref = firebase.database().ref(`blocks/${board_id}/${block_id}`);
      } else {
        ref = firebase.database().ref(`blocks/${board_id}`).push();
      }
      if (blockType === BlockTypes.Files && files.length === 1) {
        const fileTypeGeneral = files[0].fileType.split("/")[0];
        const fileTypeSpecific = files[0].fileType.split("/")[1];
        if (fileTypeGeneral === "image") {
          newBlockType = BlockTypes.Image;
          image_path = files[0].filePath;
          imageFiles = newFiles;
          newFiles = [];
        } else if (
          fileTypeGeneral === "application" &&
          fileTypeSpecific === "pdf"
        ) {
          newBlockType = BlockTypes.PDF;
          pdf_path = files[0].filePath;
          pdfFiles = newFiles;
          newFiles = [];
        }
      }

      newItems = new Map(items);
      newBlock = {
        ...blockDefaults,
        isNew,
        type: newBlockType || blockDefaults.type,
        title:
          blockTypeLabels[newBlockType] || blockTypeLabels[blockDefaults.type],
        id: ref.key,
        board_id,
        created_by: wbid,
        files: newFiles,
        imageFiles,
        pdfFiles,
        image_path,
        pdf_path,
        gridFiles,
        date_created: new Date().toJSON(),
        x:
          (Array.from(items.values()).length * 2) %
          (isUppyUpload ? 10 : cols || GRID_LG_COLS),
        y: compactType === "vertical" ? 1000 : 0, // puts it at the bottom,
      };
    }

    const { clone, files: extractedFiles } = extractFiles(newBlock);
    const cloneUrlProp = getBlockUrlProp(clone);

    if (cloneUrlProp && extractedFiles.size) {
      clone[cloneUrlProp] = "";
      newBlock[cloneUrlProp] = "";
    }

    if (extractedFiles.size) {
      this.extractedFiles.set(newBlock.id, extractedFiles);
    }

    ref.set(clone, onComplete);
    updateBoardMetadata(board_id, user.wbid);
    newItems.set(newBlock.id, newBlock);
    this.setState({
      items: newItems,
    });
  };

  // We're using the cols coming back from this to calculate where to add new items.
  onBreakpointChange(breakpoint, cols) {
    this.setState({
      // eslint-disable-next-line react/no-unused-state
      breakpoint,
      cols,
    });
  }

  onLayoutChange(layout, layouts) {
    const { loaded, items, board_id } = this.state;
    const { readOnly, layoutChangeMethod } = this.props;

    if (loaded && !readOnly) {
      layoutChangeMethod(layout, layouts);

      const ref = firebase.database().ref();
      const updates = {};

      _forOwn(layouts, (breakpointLayouts, breakpoint) => {
        breakpointLayouts.forEach((l) => {
          const blockId = this.getBlockIdFromReactKey(l.i);
          const block = items.get(blockId);
          const gridProps = ["h", "w", "x", "y"];

          gridProps.forEach((prop) => {
            // Update only values that have changed.
            // Check block.grid[breakpoint][prop] first, then block[prop].
            const blockVal = _get(
              block,
              `grid.${breakpoint}.${prop}`,
              block[prop]
            );
            const updatePath = `blocks/${board_id}/${blockId}/grid/${breakpoint}/${prop}`;

            if (l[prop] !== blockVal) {
              updates[updatePath] = l[prop];

              // If the grid property is being changed back to block[prop],
              // then remove it from the DB to save space.
              if (updates[updatePath] === block[prop]) {
                updates[updatePath] = null;
              }
            }
          });
        });
      });

      ref.update(updates);
    }
  }

  getBlockClasses() {
    const { isDragging } = this.state;

    return clsx({
      // eslint-disable-next-line camelcase
      blockClass_dragEnabled: isDragging,
    });
  }

  handleClick = (event) => {
    const { mouseY } = this.state;

    if (typeof event.target.className === "string") {
      if (
        event.target.className &&
        (event.target.className.includes("react-grid-layout") ||
          event.target.className.includes("block-welcome-screen"))
      ) {
        event.preventDefault();
        this.setState({
          mouseX: event.clientX - 2,
          mouseY: event.clientY - 4,
        });
      } else if (
        mouseY ||
        (event.target.className &&
          event.target.className.includes("MuiPopover-root"))
      ) {
        event.preventDefault();
        this.handleClose();
      }
    }
  };

  handleClose = () => {
    this.setState({
      mouseX: null,
      mouseY: null,
      isMenuLoadMore: false,
    });
  };

  createLayoutItem = (el) => {
    const layoutItem = {
      ...el,
      i: this.makeReactKey(el),
    };

    const responsiveLayoutItem = {};

    breakpoints.forEach((breakpoint) => {
      responsiveLayoutItem[breakpoint] = rglUtils.cloneLayoutItem({
        ...layoutItem,
        ...((el.grid && el.grid[breakpoint]) || {}),
      });
    });

    return responsiveLayoutItem;
  };

  mouseDown = (e) => {
    e.stopPropagation();
  };

  onItemLeaveAction = (id) => {
    const { items } = this.state;
    if (items.get(id).isFocus) {
      const newItems = new Map(items);
      newItems.get(id).isFocus = false;
      this.setState({ items: newItems });
    }
  };

  onItemEnterAction = (id) => {
    const { items } = this.state;
    if (!items.get(id).isFocus) {
      const newItems = new Map(items);
      newItems.get(id).isFocus = true;
      this.setState({ items: newItems });
    }
  };

  handleMenuItemAction = (type) => {
    this.onAddItem(type);
    this.handleClose();
  };

  mouseDown = (e) => {
    e.stopPropagation();
  };

  sendData = (val, type) => {
    const { board_id, id, isNew } = val;

    if (type === "saveAndNew") {
      this.onAddItem(val.type);
    } else if (type === "moveFilesToNewBlock") {
      this.onAddItem(
        BlockTypes.Files,
        val.updatedFileList,
        val.block_id,
        val.onComplete,
        false
      );
    } else if (type === "cloneBlock") {
      this.onAddItem("Clone", [], val.block_id, undefined, false);
    } else if (type === "cancel" && isNew) {
      firebase.database().ref(`blocks/${board_id}/${id}`).remove();
    }
  };

  handleDrag() {
    const { isDragging } = this.state;

    if (!isDragging) {
      this.setState((prevState) => ({
        isDragging: !prevState.isDragging,
      }));
    }
  }

  freezeBlock(id) {
    const { items, board_id } = this.state;
    const copy = new Map(items);
    const ref = firebase.database().ref(`blocks/${board_id}/${id}`);
    const block = copy.get(id);
    if (block.static) {
      block.static = false;
    } else {
      block.static = true;
    }
    this.setState(
      {
        items: copy,
      },
      () => {
        ref.update({
          static: block.static,
        });
      }
    );
  }

  didDragStart() {
    setTimeout(
      () => {
        this.setState({ isDragging: true });
      },
      1000,
      this
    );
  }

  didDragEnd() {
    this.setState({ isDragging: false });
  }

  createElement(el) {
    const { readOnly, board_id, board_name, board_members } = this.props;
    const board = {
      board_id,
      board_name,
      board_members,
    };

    const { items, fullViewId, fullViewPageNumber } = this.state;
    const { user } = this.context;

    if (!access.isBlockOwner(el, user) && el.isPrivateTextBlock) {
      return [];
    }

    const key = this.makeReactKey(el);

    const wrapperClasses = clsx({
      [`block-type-${el.type}`]: true,
    });

    let PinComponent = PinIcon;

    if (items.get(el.id).static) {
      PinComponent = ControlCameraIcon;
    }

    return (
      <div
        key={key}
        className={wrapperClasses}
        onClick={this.mouseDown}
        onKeyPress={this.handleClick}
        role="button"
        tabIndex={0}
        onMouseEnter={() => this.onItemEnterAction(el.id)}
        onMouseOver={() => this.onItemEnterAction(el.id)}
        onFocus={() => {}}
        onMouseLeave={() => this.onItemLeaveAction(el.id)}
        ref={this.blockRef}
      >
        <Block
          isFullView={fullViewId === el.id}
          fullViewPageNumber={fullViewPageNumber}
          board={board}
          useWebhook={el.useWebhook}
          useQAWebhook={el.useQAWebhook}
          useButtonWebhook={el.useButtonWebhook}
          isFireMyActions={el.isFireMyActions}
          webhookURL={el.webhookURL}
          sendData={this.sendData}
          className={this.getBlockClasses()}
          isNew={el.isNew}
          useIframely={el.useIframely}
          id={el.id}
          isFocus={el.isFocus}
          isPrivateTextBlock={el.isPrivateTextBlock}
          isTransparentTextBlock={el.isTransparentTextBlock}
          board_id={el.board_id}
          board_name={board_name}
          conversation={el.conversation}
          created_by={el.created_by}
          dateCreated={el.date_created}
          video_id={el.video_id}
          sheet_url={el.sheet_url}
          iframe_url={el.iframe_url}
          powerpoint_url={el.powerpoint_url}
          pdf_path={el.pdf_path}
          image_path={el.image_path}
          imageLink={el.imageLink}
          data={el.data}
          qa_data={el.qa_data}
          qaEmailBoardOwner={el.qaEmailBoardOwner}
          files={el.files}
          gridFiles={el.gridFiles}
          buttons={el.buttons}
          imageFiles={el.imageFiles}
          pdfFiles={el.pdfFiles}
          textEditorFiles={el.textEditorFiles}
          fileRequestFiles={el.fileRequestFiles}
          fileRequestSettings={el.fileRequestSettings}
          checked={el.checked}
          title={el.title}
          header_title={el.header_title}
          text={el.text}
          type={el.type}
          rss_url={el.rss_url}
          metadata={el.metadata}
          readOnly={readOnly}
          color={el.color}
          scriptEmbed={el.scriptEmbed}
          static={el.static}
          itemLeaveAction={() => this.onItemLeaveAction(el.id)}
          getBlockRef={() => this.blockRef}
        />
        <br />
        {!readOnly && el.isFocus && (
          <PinComponent
            onClick={() => {
              this.freezeBlock(el.id);
            }}
            onKeyPress={() => {
              this.freezeBlock(el.id);
            }}
            role="button"
            tabIndex={0}
            className="pin-button"
          />
        )}
      </div>
    );
  }

  renderLayoutItems = (items) => {
    const itemsArray = getItemsArray(items);

    const layoutItems = itemsArray.map(this.createLayoutItem);

    return layoutItems;
  };

  renderElements = (items) => {
    const itemsArray = getItemsArray(items);

    const elements = itemsArray.map((el) => this.createElement(el));

    return elements;
  };

  renderNewBoardUiAnnouncement() {
    const {
      modal: { showModal },
    } = this.props;

    const { user } = this.context;

    // Only show this annoucement to users who have already completed
    // the tutorial some time prior to the new Board UI launching.
    // The tutorial itself has been updated to guide new users through
    // the new Board UI, so those who haven't seen it yet (or those who
    // reset the tutorial) do not need to see this annoucement.
    if (user.tutorialStep >= 6 && !user.hasSeenNewButtonUiAnnouncement) {
      showModal(NewBoardUiAnnoncement);
    }
  }

  render() {
    const {
      items,
      readOnly,
      loaded,
      alertNewProps,
      mouseX,
      mouseY,
      isMenuLoadMore,
      readOnlyBodyColor,
      isUppyDashboardOpen,
      fullViewId,
      fullViewPageNumber,
    } = this.state;

    const { bodyColor, toolbarContainer } = this.props;
    const { user } = this.context;

    const layoutItems = this.renderLayoutItems(items);
    // `this.renderElements()` doesn't actually use the `user`, `fullViewId`,
    // and `fullViewPageNumber`, arguments. We just pass them in so that memoize-one
    // clears its cache when they change.
    const elements = this.renderElements(
      items,
      user,
      fullViewId,
      fullViewPageNumber
    );
    const layout = {};

    breakpoints.forEach((breakpoint) => {
      if (!layout[breakpoint]) {
        layout[breakpoint] = [];
      }

      layoutItems.forEach((layoutItem) => {
        layout[breakpoint].push(layoutItem[breakpoint]);
      });
    });

    const currentScale = 1;

    const containerProps = {
      className: "whiteboard",
      ...(!readOnly && {
        onContextMenu: this.handleClick,
        style: { cursor: "context-menu" },
      }),
    };

    const finalBodyColor =
      readOnlyBodyColor === undefined ? bodyColor : readOnlyBodyColor;

    return (
      <div>
        {this.uppy && (
          <DashboardModal
            uppy={this.uppy}
            open={isUppyDashboardOpen}
            onRequestClose={this.handleRequestClose}
            closeAfterFinish
          />
        )}
        {!readOnly && (
          <Portal container={toolbarContainer}>
            <Toolbar
              onClickAddItem={this.handleMenuItemAction}
              bodyColor={finalBodyColor}
            />
          </Portal>
        )}
        <div {...containerProps}>
          {loaded && (
            <>
              {alertNewProps && (
                <div className="new-props-dialog">
                  <div>
                    <p>Some changes have been made!</p>
                    <button
                      type="button"
                      onClick={() => {
                        this.setState({ alertNewProps: false });
                      }}
                    >
                      Dismiss
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        window.location.reload();
                      }}
                    >
                      Update
                    </button>
                  </div>
                </div>
              )}
              {!items.size && (
                <BlockWelcomeScreen type={readOnly ? "readOnly" : "regular"} />
              )}
              {items.size && (
                <ResponsiveReactGridLayout
                  layouts={layout}
                  containerPadding={[20, 100]}
                  transformScale={currentScale}
                  onLayoutChange={this.onLayoutChange}
                  onBreakpointChange={this.onBreakpointChange}
                  onDragStop={this.didDragEnd}
                  onDrag={this.handleDrag}
                  draggableHandle=".drag"
                  {...this.props}
                  style={{
                    backgroundColor: hexToRgba(finalBodyColor, 0.75),
                  }}
                >
                  {elements}
                </ResponsiveReactGridLayout>
              )}
            </>
          )}

          {!loaded && <Loader />}
          {!readOnly && (
            <Menu
              keepMounted
              open={mouseY !== null}
              onClose={this.handleClose}
              anchorReference="anchorPosition"
              anchorPosition={
                mouseY !== null && mouseX !== null
                  ? { top: mouseY, left: mouseX }
                  : undefined
              }
            >
              <BlockTypeMenuItem
                key={BlockTypes.Text}
                blockType={BlockTypes.Text}
                onClick={() => this.handleMenuItemAction(BlockTypes.Text)}
              />
              <BlockTypeMenuItem
                key={BlockTypes.PDF}
                blockType={BlockTypes.PDF}
                onClick={() => this.handleMenuItemAction(BlockTypes.PDF)}
              />
              <BlockTypeMenuItem
                key={BlockTypes.Image}
                blockType={BlockTypes.Image}
                onClick={() => this.handleMenuItemAction(BlockTypes.Image)}
              />
              <BlockTypeMenuItem
                key={BlockTypes.Video}
                blockType={BlockTypes.Video}
                onClick={() => this.handleMenuItemAction(BlockTypes.Video)}
              />
              <BlockTypeMenuItem
                key={BlockTypes.Files}
                blockType={BlockTypes.Files}
                onClick={() => this.handleMenuItemAction(BlockTypes.Files)}
              />
              <Divider />
              <BlockTypeMenuItem
                key={BlockTypes.Buttons}
                blockType={BlockTypes.Buttons}
                onClick={() => this.handleMenuItemAction(BlockTypes.Buttons)}
              />
              <BlockTypeMenuItem
                key={BlockTypes.Checklist}
                blockType={BlockTypes.Checklist}
                onClick={() => this.handleMenuItemAction(BlockTypes.Checklist)}
              />
              <BlockTypeMenuItem
                key={BlockTypes.Conversation}
                blockType={BlockTypes.Conversation}
                onClick={() =>
                  this.handleMenuItemAction(BlockTypes.Conversation)
                }
              />
              {!isMenuLoadMore ? (
                <MenuItem
                  onClick={() => this.setState({ isMenuLoadMore: true })}
                >
                  More...
                </MenuItem>
              ) : (
                [
                  // <BlockTypeMenuItem
                  //   key={BlockTypes.Spreadsheet}
                  //   blockType={BlockTypes.Spreadsheet}
                  //   onClick={() => this.handleMenuItemAction(BlockTypes.Spreadsheet)}
                  // />,
                  <BlockTypeMenuItem
                    key={BlockTypes.ScriptEmbed}
                    blockType={BlockTypes.ScriptEmbed}
                    onClick={() =>
                      this.handleMenuItemAction(BlockTypes.ScriptEmbed)
                    }
                  />,
                  <BlockTypeMenuItem
                    key={BlockTypes.Iframe}
                    blockType={BlockTypes.Iframe}
                    onClick={() => this.handleMenuItemAction(BlockTypes.Iframe)}
                  />,
                  <BlockTypeMenuItem
                    key={BlockTypes.FileRequest}
                    blockType={BlockTypes.FileRequest}
                    onClick={() =>
                      this.handleMenuItemAction(BlockTypes.FileRequest)
                    }
                  />,
                  <BlockTypeMenuItem
                    key={BlockTypes.QAForm}
                    blockType={BlockTypes.QAForm}
                    onClick={() => this.handleMenuItemAction(BlockTypes.QAForm)}
                  />,
                  <BlockTypeMenuItem
                    key={BlockTypes.RSS}
                    blockType={BlockTypes.RSS}
                    onClick={() => this.handleMenuItemAction(BlockTypes.RSS)}
                  />,
                  <BlockTypeMenuItem
                    key={BlockTypes.Grid}
                    blockType={BlockTypes.Grid}
                    onClick={() => this.handleMenuItemAction(BlockTypes.Grid)}
                  />,
                  // <BlockTypeMenuItem
                  //   key={BlockTypes.Powerpoint}
                  //   blockType={BlockTypes.Powerpoint}
                  //   onClick={() => this.handleMenuItemAction(BlockTypes.Powerpoint)}
                  // />,
                ]
              )}
            </Menu>
          )}
        </div>
      </div>
    );
  }
}

AddRemoveLayout.contextType = UserContext;

AddRemoveLayout.defaultProps = {
  className: "layout",
  cols: { lg: GRID_LG_COLS, md: 10, sm: 6, xs: 4, xxs: 2 },
  rowHeight: 100,
  margin: [20, 20],
  readOnly: false,
  readOnlyId: "",
};

AddRemoveLayout.propTypes = {
  readOnly: PropTypes.bool,
  readOnlyId: PropTypes.string,
  margin: PropTypes.arrayOf(PropTypes.number),
  rowHeight: PropTypes.number,
  cols: PropTypes.objectOf(PropTypes.number),
  className: PropTypes.string,
  board_id: PropTypes.string.isRequired,
  board_name: PropTypes.string.isRequired,
  board_members: PropTypes.arrayOf(PropTypes.string).isRequired,
};

const mapStateToProps = (state) => ({
  compactType: state.setting.compactType,
  freezeAll: state.setting.freezeAll,
  beautify: state.setting.beautify,
  headerColor: state.setting.headerColor,
  bodyColor: state.setting.bodyColor,
});

const enhance = compose(
  withSnackbar,
  connect(mapStateToProps),
  withOnDatabaseEvent(),
  withModal()
);

export default enhance(AddRemoveLayout);
