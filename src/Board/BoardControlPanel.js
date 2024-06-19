import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  forwardRef,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import * as Sentry from "@sentry/react";
import firebase from "firebase/compat/app";
import "firebase/compat/database";
import { useHistory, useLocation } from "react-router-dom";
import { useSnackbar } from "notistack";
import { IconButton, Tooltip } from "@material-ui/core";
import ExitToApp from "@material-ui/icons/ExitToAppOutlined";
import SettingsIcon from "@material-ui/icons/SettingsOutlined";
import AcUnitIcon from "@material-ui/icons/AcUnitOutlined";
import ShareIcon from "@material-ui/icons/ShareOutlined";
import { grey } from "@material-ui/core/colors";
import { useConfirm } from "material-ui-confirm";
import { useModal } from "mui-modal-provider";
import CalendarViewMonthIcon from "../components/icons/CalendarViewMonth";
import Stack from "../components/Stack";
import TutorialPopper from "../components/TutorialPopper";
import BoardDetails from "../BoardDetails";
import { ThemeColors } from "../constant";
import { toggleBeautify, toggleFreezeAll } from "../actions/setting";
import useUser from "../auth/useUser";
import access from "../access";
import { emailToId, createUUID } from "../utils";
import AuthCheck from "../auth/AuthCheck";

const BoardControlPanel = forwardRef(({ id, members, name }, ref) => {
  const dispatch = useDispatch();
  const history = useHistory();
  const { hash } = useLocation();
  const confirm = useConfirm();
  const { showModal } = useModal();
  const { enqueueSnackbar } = useSnackbar();
  const settingsRef = useRef(null);
  const shareRef = useRef(null);
  const tidyRef = useRef(null);
  const freezeRef = useRef(null);
  const [activeRef, setActiveRef] = useState(null);
  const modalRef = useRef(null);

  const { user } = useUser();
  const {
    uniqueUrl,
    friendlyUrl,
    freezeAll: isBoardFrozen,
    isSecured,
    headerColor,
  } = useSelector((state) => state.setting);

  const getBoardDetailsProps = useCallback(() => {
    return {
      formProps: {
        id: "board-invite-form",
      },
      board_members: members,
      board_name: name,
      board_id: id,
      unique_url: uniqueUrl,
      friendly_url: friendlyUrl,
      isSecured,
    };
  }, [members, name, id, uniqueUrl, friendlyUrl, isSecured]);

  const handleOpenSettings = useCallback(() => {
    return showModal(BoardDetails, getBoardDetailsProps());
  }, [showModal, getBoardDetailsProps]);

  useEffect(() => {
    if (hash === "#change-password") {
      if (!modalRef.current) {
        modalRef.current = handleOpenSettings();
      } else {
        modalRef.current.update(getBoardDetailsProps());
      }
    }
  }, [hash, handleOpenSettings, getBoardDetailsProps]);

  useEffect(() => {
    if (user.tutorialStep) {
      switch (user.tutorialStep) {
        case 3:
          setActiveRef(settingsRef);
          break;
        case 4:
          setActiveRef(shareRef);
          break;
        case 5:
          setActiveRef(tidyRef);
          break;
        case 6:
          setActiveRef(freezeRef);
          break;
        default:
          setActiveRef(null);
      }
    }
  }, [user.tutorialStep]);

  const canTidyBoard = () => {
    return access.canTidyBoard({ board_members: members }, user);
  };

  const canLeaveBoard = () => {
    return access.canLeaveBoard({ board_members: members }, user);
  };

  const canMakeBoardsPublic = () => {
    return access.canMakeBoardPublic({ board_members: members }, user);
  };

  const canShareBoard = () => {
    return access.canShareBoard({ board_members: members }, user);
  };

  const handleLeaveConfirm = async () => {
    try {
      let newBoardMembers = members;

      newBoardMembers = newBoardMembers.filter(
        (elem) => elem !== emailToId(user.email)
      );

      const updates = {
        [`/whiteboards/${id}/board_members`]: newBoardMembers,
        [`/users/${user.wbid}/whiteboards/${id}`]: null,
      };

      await firebase.database().ref().update(updates);

      history.push("/");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      Sentry.captureException(err);

      enqueueSnackbar(err.toString(), {
        variant: "error",
      });
    }
  };

  const handleClickLeave = () => {
    confirm({
      title: "Are you sure you want to leave this whatboard?",
      confirmationText: "Leave",
    })
      .then(handleLeaveConfirm)
      .catch();
  };

  const handleShare = async () => {
    try {
      let urlToShare;

      if (friendlyUrl) {
        urlToShare = `${window.location.origin}/b/${friendlyUrl}`;
      } else {
        let uniqueUrlHash = uniqueUrl;

        if (!uniqueUrl) {
          uniqueUrlHash = createUUID();

          await firebase
            .database()
            .ref(`whiteboards/${id}`)
            .update({ unique_url: uniqueUrlHash });
        }

        urlToShare = `${window.location.origin}/readonlyboard/${id}?invitation=${uniqueUrlHash}`;
      }

      navigator.clipboard.writeText(urlToShare);

      enqueueSnackbar("Copied to clipboard", {
        variant: "success",
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      Sentry.captureException(err);

      enqueueSnackbar(err.toString(), {
        variant: "error",
      });
    }
  };

  const handleTutorialTry = () => {
    if (user.tutorialStep) {
      switch (user.tutorialStep) {
        case 3:
          handleOpenSettings();
          break;
        case 4:
          handleShare();
          break;
        case 5:
          dispatch(toggleBeautify());
          break;
        case 6:
          dispatch(toggleFreezeAll());
          break;
        default:
      }
    }
  };

  const iconColor =
    headerColor === ThemeColors.WHITE ||
    headerColor === ThemeColors.NOCOLOR ||
    headerColor === ThemeColors.LIGHTGREY ||
    headerColor === ThemeColors.BEIGE
      ? grey[700]
      : "white";

  return (
    <Stack direction="row" spacing={1}>
      {activeRef && (
        <TutorialPopper
          popperAnchor={activeRef.current}
          onClose={() => setActiveRef(null)}
          onTry={handleTutorialTry}
          placement="left"
        />
      )}
      <div className="toolbar-portal" ref={ref} />
      <AuthCheck accessCheck={canShareBoard}>
        <Tooltip title="Board Settings" arrow placement="bottom">
          <IconButton ref={settingsRef} onClick={handleOpenSettings}>
            <SettingsIcon htmlColor={iconColor} />
          </IconButton>
        </Tooltip>
      </AuthCheck>
      <AuthCheck accessCheck={canMakeBoardsPublic}>
        <Tooltip
          title="Create &amp; copy shareable link to the clipboard"
          arrow
          placement="bottom"
        >
          <IconButton onClick={handleShare} ref={shareRef}>
            <ShareIcon htmlColor={iconColor} />
          </IconButton>
        </Tooltip>
      </AuthCheck>
      <AuthCheck accessCheck={canTidyBoard}>
        <Tooltip title="Tidy Up Board" arrow placement="bottom">
          <IconButton
            onClick={() => dispatch(toggleBeautify())}
            disabled={isBoardFrozen}
            ref={tidyRef}
          >
            <CalendarViewMonthIcon htmlColor={iconColor} />
          </IconButton>
        </Tooltip>
      </AuthCheck>
      <Tooltip
        title={isBoardFrozen ? "Unfreeze" : "Freeze"}
        arrow
        placement="bottom"
      >
        <IconButton onClick={() => dispatch(toggleFreezeAll())} ref={freezeRef}>
          <AcUnitIcon htmlColor={iconColor} />
        </IconButton>
      </Tooltip>
      <AuthCheck accessCheck={canLeaveBoard}>
        <Tooltip title="Leave the board" arrow placement="bottom">
          <IconButton onClick={handleClickLeave}>
            <ExitToApp htmlColor={iconColor} />
          </IconButton>
        </Tooltip>
      </AuthCheck>
    </Stack>
  );
});

export default BoardControlPanel;
