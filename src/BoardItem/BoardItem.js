import React, { useState } from "react";
import firebase from "firebase/compat/app";
import "firebase/compat/database";
import * as Sentry from "@sentry/react";
import $ from "jquery";
import Modal from "react-bootstrap/Modal";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import LockIcon from "@material-ui/icons/LockOutlined";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import MoreVertIcon from "@material-ui/icons/MoreVertOutlined";
import {
  usePopupState,
  bindTrigger,
  bindMenu,
} from "material-ui-popup-state/hooks";
import { useModal } from "mui-modal-provider";
import CornerRibbon from "react-corner-ribbon";
import { Link, useHistory } from "react-router-dom";
import PropTypes from "prop-types";
import Tooltip from "@material-ui/core/Tooltip";
import TextField from "@material-ui/core/TextField";
import Dayjs from "dayjs";
import InfoIcon from "@material-ui/icons/InfoOutlined";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import clsx from "clsx";
import { useDispatch } from "react-redux";
import { useSnackbar } from "notistack";
import {
  idToEmail,
  emailToId,
  downloadBoard,
  getCallableFbFunction,
} from "../utils";
import BoardAccessControl from "../Board/AccessControl";
import access from "../access";
import useUser from "../auth/useUser";
import RestrictedMenuItem from "../RestrictedMenuItem";
import BoardCloneFormModal from "../BoardCloneFormModal";
import BoardDetails from "../BoardDetails";
import RateLimitErrorModal from "../Board/RateLimitErrorModal";
import "../Dashboard/Dashboard.scss";
import {
  setHeaderColor,
  setBodyColor,
  setBoardProtected,
} from "../actions/setting";
import {
  StyledBoardTitle,
  StyledButtonbase,
  MenuItemText,
} from "./BoardItems.styles";

const PRIMARY_BLUE = "#2c387e";
const PRIMARY_GREEN = "#1db953";
const LIGHT_GRAY = "#7d7d7d";

const BoardItem = (props) => {
  // ALL unused states should be moved to props.
  const {
    board_members,
    isArchived,
    unique_url,
    board_name: board_nameProp,
    board_id,
    isPublic,
    date_created,
    publicURLUpdated,
    friendly_url,
    pinned,
    onCreatingBoard,
    onCreateBoardSuccess,
    onCreateBoardError,
    isSecured,
    board_header_color,
    boardBodyColor,
    isLimited,
  } = props;
  const { showModal } = useModal();
  const [board_name, setBoardName] = useState(board_nameProp);
  const [isOpen, setIsOpen] = useState(false);
  const [leaveMode, setLeaveMode] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [cloneMode, setCloneMode] = useState(false);
  const [removeMode, setRemoveMode] = useState(false);
  const [pinMode, setPinMode] = useState(false);
  const [unpinMode, setUnpinMode] = useState(false);
  const [isProtected, setIsProtected] = useState(false);
  const [lockedAction, setLockedAction] = useState("");
  const [
    isEmptyWhatboardSubmission,
    setIsEmptyWhatboardSubmission,
  ] = React.useState(false);

  const [downloadMode, setDownloadMode] = React.useState(false);
  const { user } = useUser();
  const popupState = usePopupState({
    variant: "popover",
    popupId: `board-menu-${board_id}`,
  });

  const history = useHistory();

  const dispatch = useDispatch();

  const { enqueueSnackbar } = useSnackbar();

  const getNumShared = () => {
    return Math.max(0, board_members.length - 1);
  };

  const getStatusIconStyle = () => {
    const numShared = getNumShared();
    let iconColor = LIGHT_GRAY;

    if (isPublic) {
      iconColor = PRIMARY_GREEN;
    } else if (numShared > 0) {
      iconColor = PRIMARY_BLUE;
    }

    return {
      color: iconColor,
    };
  };

  const canShareBoard = (userContext) => {
    const board = {
      board_id,
      board_name,
      board_members,
    };

    return access.canShareBoard(board, userContext);
  };

  const canDeleteBoard = (userContext) => {
    const board = {
      board_id,
      board_name,
      board_members,
    };

    return access.canDeleteBoard(board, userContext);
  };

  const canEditBoard = (userContext) => {
    const board = {
      board_id,
      board_name,
      board_members,
    };

    return access.canEditBoard(board, userContext);
  };

  const goToBoard = (e) => {
    if (e.target.matches(".board")) {
      history.push(`/board/${board_id}`);
    }
  };

  const removeBoard = async () => {
    if (downloadMode) {
      await downloadBoard(board_id, board_name);
    }

    const updates = {
      [`/whiteboards/${board_id}`]: {},
      [`/users/${user.wbid}/whiteboards/${board_id}`]: {},
    };

    await firebase.database().ref().update(updates);
  };

  const setPinStatus = async (bool) => {
    await firebase
      .database()
      .ref(`/users/${user.wbid}/whiteboards/${board_id}`)
      .update({
        pinned: bool,
      });
  };

  const leaveBoard = async () => {
    let newBoardMembers = board_members;

    if (downloadMode) {
      await downloadBoard(board_id, board_name);
    }

    newBoardMembers = newBoardMembers.filter(
      (elem) => elem !== emailToId(user.email)
    );

    const updates = {
      [`/whiteboards/${board_id}/board_members`]: newBoardMembers,
      [`/users/${user.wbid}/whiteboards/${board_id}`]: {},
    };

    await firebase.database().ref().update(updates);
  };

  const saveModal = async () => {
    try {
      if ($("#whiteboard_name_modal_input").val()) {
        setIsOpen(false);
      }

      if (removeMode) {
        await removeBoard();
      } else if (leaveMode) {
        await leaveBoard();
      } else if (pinMode) {
        await setPinStatus(true);
      } else if (unpinMode) {
        await setPinStatus(false);
      } else if (editMode) {
        if ($("#whiteboard_name_modal_input").val()) {
          setIsEmptyWhatboardSubmission(false);
          setBoardName($("#whiteboard_name_modal_input").val());
          await firebase
            .database()
            .ref(`/whiteboards/${board_id}`)
            .update({ board_name: $("#whiteboard_name_modal_input").val() });
        } else {
          setIsEmptyWhatboardSubmission(true);
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      Sentry.captureException(err);

      enqueueSnackbar(err.toString(), {
        variant: "error",
      });
    }
  };

  const getBoardDetailsProps = () => {
    return {
      formProps: {
        id: "board-invite-form",
      },
      board_members,
      board_name,
      board_id,
      unique_url,
      friendly_url,
      isSecured,
      publicURLUpdated,
    };
  };

  const openBoardDetails = () => {
    dispatch(setHeaderColor(board_header_color));
    dispatch(setBodyColor(boardBodyColor));
    dispatch(setBoardProtected(isSecured));
    showModal(BoardDetails, getBoardDetailsProps());
  };

  const checkSecureGuard = async () => {
    const getBoardFunc = getCallableFbFunction("boards-getBoardDetails");

    const { data } = await getBoardFunc({ boardId: board_id });
    setIsProtected(!!data.locked);

    return data.locked;
  };

  const renderRemovalBoard = () => {
    let content = null;
    const board = {
      board_id,
      board_name,
      board_members,
    };

    if (access.canLeaveBoard(board, user)) {
      content = (
        <MenuItem
          onClick={() => {
            popupState.close();
            setIsOpen(true);
            setEditMode(false);
            setRemoveMode(false);
            setLeaveMode(true);
            setCloneMode(false);
            setPinMode(false);
          }}
        >
          <MenuItemText>Leave Board</MenuItemText>
        </MenuItem>
      );
    } else {
      content = (
        <RestrictedMenuItem
          AuthCheckProps={{
            accessCheck: canDeleteBoard,
          }}
          onClick={() => {
            popupState.close();
            setIsOpen(true);
            setEditMode(false);
            setRemoveMode(true);
            setCloneMode(false);
            setUnpinMode(false);
            setPinMode(false);
          }}
        >
          <MenuItemText>Remove Board</MenuItemText>
        </RestrictedMenuItem>
      );
    }
    return content;
  };

  const renderBoardTitle = () => {
    let data = (
      <StyledBoardTitle
        className="board-title"
        board_header_color={board_header_color}
      >
        {isSecured && (
          <LockIcon fontSize="small" className="board-title_lock-icon" />
        )}
        <Link to={`/board/${board_id}`}>
          {board_name.length > 22
            ? `${board_name.substring(0, 22)}...`
            : board_name}
        </Link>
      </StyledBoardTitle>
    );
    if (board_name.length > 22) {
      data = <Tooltip title={board_name}>{data}</Tooltip>;
    }

    return data;
  };

  const renderModal = () => {
    let modalTitle = "";
    let modalBody = null;
    let modalFooterSubmitText = "";
    const downloadCheckBoxBody = (
      <FormControlLabel
        control={
          <Checkbox
            checked={downloadMode}
            onChange={(e) => setDownloadMode(e.target.checked)}
            name="download-check-box"
          />
        }
        label={`Download this whatboard before ${
          removeMode ? "removal" : "departure"
        }`}
      />
    );

    if (removeMode) {
      modalTitle =
        "Are you sure you want to permanently remove this whatboard?";
      modalFooterSubmitText = "Remove";
      modalBody = downloadCheckBoxBody;
    } else if (pinMode) {
      modalTitle = "Are you sure you want to pin this whatboard?";
      modalFooterSubmitText = "Pin";
    } else if (unpinMode) {
      modalTitle = "Are you sure you want to unpin this whatboard?";
      modalFooterSubmitText = "Unpin";
    } else if (editMode) {
      modalTitle = "Rename Whatboard";
      modalBody = (
        <TextField
          error={isEmptyWhatboardSubmission}
          helperText={
            isEmptyWhatboardSubmission ? "Whatboard name can't be empty" : null
          }
          defaultValue={board_name}
          id="whiteboard_name_modal_input"
          className="form-control"
        />
      );
      modalFooterSubmitText = "Save";
    } else if (leaveMode) {
      modalTitle = "Are you sure you want to leave this whatboard?";
      modalBody = downloadCheckBoxBody;
      modalFooterSubmitText = "Leave";
    } else if (cloneMode && !isProtected) {
      return (
        <BoardCloneFormModal
          onSubmitting={onCreatingBoard}
          onSuccess={onCreateBoardSuccess}
          onError={onCreateBoardError}
          board_id={board_id}
          board_members={board_members}
          board_name={board_name}
          modalProps={{
            show: isOpen,
            onHide: () => {
              setIsOpen(false);
            },
          }}
        />
      );
    }

    return (
      <Modal
        show={isOpen}
        onHide={() => {
          setIsOpen(false);
        }}
      >
        <Modal.Header>
          <Modal.Title>{modalTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{modalBody}</Modal.Body>
        <Modal.Footer>
          <>
            <Button
              className="neutral-button margined-button"
              onClick={() => {
                setIsOpen(false);
                setIsEmptyWhatboardSubmission(false);
              }}
              type="button"
            >
              Cancel
            </Button>
            <Button
              className={clsx({
                "cancel-button margined-button":
                  leaveMode || removeMode || unpinMode,
                "confirm-button margined-button": editMode || pinMode,
              })}
              onClick={saveModal}
              type="button"
            >
              {modalFooterSubmitText}
            </Button>
          </>
        </Modal.Footer>
      </Modal>
    );
  };

  const handleArchive = () => {
    firebase
      .database()
      .ref(`/users/${user.wbid}/whiteboards/${board_id}`)
      .update({
        isArchived: !isArchived,
      });
  };

  const handleSaveBoard = async () => {
    downloadBoard(board_id, board_name);
  };

  const handleBoardUnlock = () => {
    setIsProtected(false);
    switch (lockedAction) {
      case "clone":
        setIsOpen(true);
        setCloneMode(true);
        break;
      case "download":
        handleSaveBoard();
        break;
      default:
    }

    setLockedAction("");
  };

  const renderStatusBadge = () => {
    const { isModifiedAfterLastViewed, isViewedAfterLoggedinUser } = props;

    return (
      <>
        {isModifiedAfterLastViewed && (
          <Tooltip
            key="modified"
            title={`Last modified on ${Dayjs(isModifiedAfterLastViewed).format(
              "MM/DD/YY hh:mm A"
            )}`}
          >
            <CornerRibbon
              position="bottom-right"
              fontColor="#770320"
              backgroundColor="#ffc5d3"
              style={{ width: 175 }}
              className=""
            >
              Modified
            </CornerRibbon>
          </Tooltip>
        )}
        {isViewedAfterLoggedinUser && (
          <Tooltip
            key="viewed"
            title={`Last viewed on ${Dayjs(isViewedAfterLoggedinUser).format(
              "MM/DD/YY hh:mm A"
            )}`}
          >
            <CornerRibbon
              position="bottom-right"
              fontColor="#4d440a"
              backgroundColor="#f0eb95"
            >
              Viewed
            </CornerRibbon>
          </Tooltip>
        )}
      </>
    );
  };

  const numShared = getNumShared();
  const iconToolTip = [
    <div key="creation-info">
      Created by {idToEmail(board_members[0])} on&nbsp;
      {Dayjs(date_created).format("YYYY-MM-DD")}
      <br />
    </div>,
  ];

  if (numShared) {
    let sharedText = "";
    if (numShared === 1) {
      sharedText = "This board has been shared with 1 user";
    } else {
      sharedText = `This board has been shared with ${numShared} users`;
    }

    iconToolTip.push(
      <span key="shared-users-info">
        {sharedText}
        <br />
      </span>
    );
  }
  if (isPublic) {
    iconToolTip.push(
      <span key="shared-public-info">This board is publicly accessible</span>
    );
  }

  return (
    <div className="board-container">
      <StyledButtonbase
        board_header_color={board_header_color}
        component="div"
        onClick={goToBoard}
        className="board"
        id={board_id}
        disableRipple
        focusVisibleClassName="focus-visible"
      >
        <div className="status-icon">
          <Tooltip title={iconToolTip}>
            <InfoIcon style={getStatusIconStyle()} />
          </Tooltip>
        </div>
        <IconButton {...bindTrigger(popupState)} className="open-menu">
          <MoreVertIcon />
        </IconButton>
        <Menu {...bindMenu(popupState)}>
          <RestrictedMenuItem
            AuthCheckProps={{
              accessCheck: canEditBoard,
            }}
            onClick={() => {
              popupState.close();
              setIsOpen(true);
              setEditMode(true);
              setRemoveMode(false);
              setCloneMode(false);
              setPinMode(false);
              setUnpinMode(false);
              setLeaveMode(false);
              setIsEmptyWhatboardSubmission(false);
            }}
          >
            <MenuItemText>Rename Board</MenuItemText>
          </RestrictedMenuItem>
          <MenuItem
            onClick={async () => {
              popupState.close();
              const locked = await checkSecureGuard();

              setEditMode(false);
              setRemoveMode(false);
              setPinMode(false);
              setUnpinMode(false);
              setLeaveMode(false);
              if (isLimited) {
                showModal(RateLimitErrorModal, { isDashboard: true });
              } else if (!locked) {
                setIsOpen(true);
                setCloneMode(true);
              } else {
                setLockedAction("clone");
              }
            }}
          >
            <MenuItemText tooltip="Create a clone of this board">
              Clone Board
            </MenuItemText>
          </MenuItem>
          {(!pinned || pinned === undefined) && (
            <MenuItem
              onClick={() => {
                popupState.close();
                setIsOpen(true);
                setEditMode(false);
                setRemoveMode(false);
                setCloneMode(false);
                setPinMode(true);
                setUnpinMode(false);
                setLeaveMode(false);
              }}
            >
              <MenuItemText tooltip="Pin board to the top of your dashboard">
                Pin Board
              </MenuItemText>
            </MenuItem>
          )}
          {pinned && (
            <MenuItem
              onClick={() => {
                popupState.close();
                setIsOpen(true);
                setEditMode(false);
                setRemoveMode(false);
                setCloneMode(false);
                setPinMode(false);
                setUnpinMode(true);
                setLeaveMode(false);
              }}
            >
              <MenuItemText>Unpin Board</MenuItemText>
            </MenuItem>
          )}

          <MenuItem
            onClick={() => {
              popupState.close();
              handleArchive();
            }}
          >
            {!isArchived && (
              <MenuItemText tooltip="Remove board from active dashboard and archive">
                Archive Board
              </MenuItemText>
            )}
            {isArchived && <MenuItemText>Unarchive Board</MenuItemText>}
          </MenuItem>
          <MenuItem
            onClick={async () => {
              popupState.close();
              const locked = await checkSecureGuard();

              if (!locked) {
                handleSaveBoard();
              } else {
                setLockedAction("download");
              }
            }}
          >
            <MenuItemText>Download Board</MenuItemText>
          </MenuItem>
          <RestrictedMenuItem
            AuthCheckProps={{
              accessCheck: canShareBoard,
            }}
            onClick={() => {
              popupState.close();
              openBoardDetails();
            }}
          >
            <MenuItemText>View board Details</MenuItemText>
          </RestrictedMenuItem>
          {renderRemovalBoard(popupState)}
        </Menu>
        {renderBoardTitle()}
        {renderStatusBadge()}
      </StyledButtonbase>
      {isProtected && (
        <BoardAccessControl
          boardId={board_id}
          onUnlock={handleBoardUnlock}
          isModal
          isModalOpen={isProtected}
          onModalHide={() => {
            setIsProtected(false);
            setCloneMode(false);
            setIsOpen(false);
            setLockedAction("");
          }}
        />
      )}
      {renderModal()}
    </div>
  );
};

BoardItem.defaultProps = {
  board_id: "",
  board_members: [],
  board_name: "",
  friendly_url: "",
  isArchived: false,
  isModifiedAfterLastViewed: false,
  isPublic: false,
  isViewedAfterLoggedinUser: false,
  metadata: {},
  publicURLUpdated: () => {},
  view_logs: {},
  onCreatingBoard: () => {},
  onCreateBoardSuccess: () => {},
};

BoardItem.propTypes = {
  board_id: PropTypes.string,
  board_members: PropTypes.arrayOf(PropTypes.string),
  board_name: PropTypes.string,
  friendly_url: PropTypes.string,
  isArchived: PropTypes.bool,
  isModifiedAfterLastViewed: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.oneOf([false]),
  ]),
  isPublic: PropTypes.bool,
  isViewedAfterLoggedinUser: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.oneOf([false]),
  ]),
  metadata: PropTypes.shape({}),
  publicURLUpdated: PropTypes.func,
  view_logs: PropTypes.shape({}),
  onCreatingBoard: PropTypes.func,
  onCreateBoardSuccess: PropTypes.func,
};

export default BoardItem;
