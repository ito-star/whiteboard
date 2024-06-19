import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import IconButton from "@material-ui/core/IconButton";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import Button from "@material-ui/core/Button";
import ExpandMoreIcon from "@material-ui/icons/ExpandMoreOutlined";
import AccountBoxIcon from "@material-ui/icons/AccountBoxOutlined";
import ExitToAppIcon from "@material-ui/icons/ExitToAppOutlined";
import HelpIcon from "@material-ui/icons/HelpOutlineOutlined";
import Divider from "@material-ui/core/Divider";
import Snackbar from "@material-ui/core/Snackbar";
import Alert from "@material-ui/lab/Alert";
import ReportProblemIcon from "@material-ui/icons/ReportProblemOutlined";
import Typography from "@material-ui/core/Typography";
import GetAppIcon from "@material-ui/icons/GetAppOutlined";
import Box from "@material-ui/core/Box";
import { useSnackbar } from "notistack";
import { initFirebase, getCallableFbFunction, downloadBoard } from "../utils";
import QueryStatsIcon from "../components/icons/QueryStats";
import useUser from "../auth/useUser";
import UserAvatar from "./UserAvatar";
import UserBoardUsage from "./UserBoardUsage";
import UserStorageUsage from "./UserStorageUsage";
import UpgradeOffer from "./UpgradeOffer";
import SupportForm from "./SupportForm";
import ReportForm from "./ReportForm";
import LinkMenuItem from "../components/LinkMenuItem/LinkMenuItem";
import "./UserMenu.scss";

initFirebase();

const UserMenu = ({
  isReportAvailable,
  board_id,
  readOnlyId,
  isWithBoard = false,
  board_name,
}) => {
  const { user, resetTutorial } = useUser();
  const [menuAnchor, setMenuAnchor] = useState();
  const [isSupportFormOpen, setSupportFormOpen] = useState();
  const [isReportFormOpen, setReportFormOpen] = useState();
  const [errMessage, setErrMessage] = useState("");
  const [isAlertOpen, setAlertOpen] = useState(false);
  const [isError, setError] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const history = useHistory();

  const handleMenuButtonClick = (event) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const showSupportForm = () => {
    setSupportFormOpen(true);
    handleMenuClose();
  };

  const handleDownloadBoard = () => {
    downloadBoard(board_id, board_name);
    handleMenuClose();
  };

  const hideSupportForm = () => {
    setSupportFormOpen(false);
  };

  const supportSuccessAction = () => {
    setErrMessage("Your message has been received.");
    setError(false);
    setAlertOpen(true);
  };

  const handleCloseAlert = () => {
    setAlertOpen(false);
  };

  const showReportForm = () => {
    setReportFormOpen(true);
    handleMenuClose();
  };

  const hideReportForm = () => {
    setReportFormOpen(false);
  };

  const sendReportBoard = async (reportReason) => {
    const func = getCallableFbFunction("boards-sendReportBoard");
    const params = {
      board_id,
      readOnlyId,
      reportReason,
    };

    await func(params);
  };

  const reportAction = async (reportReason) => {
    try {
      await sendReportBoard(reportReason);
      setErrMessage("This board has been reported successfully.");
      setAlertOpen(true);
      setError(false);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);

      enqueueSnackbar(e.toString(), {
        variant: "error",
      });
      setErrMessage(e.message ? e.message : "Sorry, Error happend.");
      setAlertOpen(true);
      setError(true);
    }
  };

  const signOut = () => {
    firebase
      .auth()
      .signOut()
      .then(() => {
        history.push("/");
      });
  };

  const handleResetTutorial = async () => {
    handleMenuClose();
    await resetTutorial();
  };

  if (user && !user.isAnonymous) {
    const signedInAs = (
      <span>
        Signed in as
        <br /> {user.email}
      </span>
    );

    return (
      <>
        <Snackbar
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          open={isAlertOpen}
          autoHideDuration={2000}
          onClose={handleCloseAlert}
        >
          <Alert
            onClose={handleCloseAlert}
            variant="filled"
            severity={isError ? "error" : "success"}
          >
            {errMessage}
          </Alert>
        </Snackbar>
        <IconButton
          disableRipple
          disableTouchRipple
          id="user-menu-button"
          aria-controls="user-menu-menu"
          aria-haspopup="true"
          onClick={handleMenuButtonClick}
        >
          <UserAvatar user={user} />
          <ExpandMoreIcon className="expand-icon" />
        </IconButton>
        <Menu
          id="user-menu-menu"
          anchorEl={menuAnchor}
          keepMounted
          variant="menu"
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
          getContentAnchorEl={null}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "center",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "center",
          }}
        >
          <ListItem>
            <ListItemText primary={signedInAs} />
          </ListItem>

          <Divider />

          <ListItemText className="center usage-header">Usage</ListItemText>
          <ListItem>
            <div className="user-boards" style={{ width: "100%" }}>
              <UserBoardUsage variant="small" />
            </div>
          </ListItem>
          <ListItem>
            <div className="user-storage" style={{ width: "100%" }}>
              <UserStorageUsage variant="small" />
            </div>
          </ListItem>
          <ListItem>
            <UpgradeOffer
              prefix="Want more?"
              className="user-menu-upgrade-offer"
              TypographyProps={{
                variant: "body2",
                align: "center",
              }}
              prefixTypographyProps={{
                display: "block",
              }}
              linkTypographyProps={{
                display: "block",
              }}
            />
          </ListItem>
          <ListItem>
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              className="tutorial-item"
            >
              <Typography variant="body2">Need Help?</Typography>
              <Typography
                variant="body2"
                className="reset-action"
                onClick={handleResetTutorial}
              >
                Reset the tutorial to refresh your memory.
              </Typography>
            </Box>
          </ListItem>
          <Divider />
          {isReportAvailable && (
            <MenuItem onClick={showReportForm}>
              <ListItemIcon>
                <ReportProblemIcon />
              </ListItemIcon>
              <ListItemText primary="Report" />
            </MenuItem>
          )}
          <LinkMenuItem to="/account">
            <ListItemIcon>
              <AccountBoxIcon />
            </ListItemIcon>
            <ListItemText primary="Account Settings" />
          </LinkMenuItem>
          <MenuItem onClick={showSupportForm}>
            <ListItemIcon>
              <HelpIcon />
            </ListItemIcon>
            <ListItemText primary="Contact Us" />
          </MenuItem>
          <LinkMenuItem to="/daily-digest">
            <ListItemIcon>
              <QueryStatsIcon />
            </ListItemIcon>
            <ListItemText primary="Daily Digest" />
          </LinkMenuItem>
          {isWithBoard && (
            <MenuItem onClick={handleDownloadBoard}>
              <ListItemIcon>
                <GetAppIcon />
              </ListItemIcon>
              <ListItemText primary="Download Board" />
            </MenuItem>
          )}
          <MenuItem onClick={signOut}>
            <ListItemIcon>
              <ExitToAppIcon />
            </ListItemIcon>
            <ListItemText primary="Sign Out" />
          </MenuItem>
        </Menu>
        <SupportForm
          show={isSupportFormOpen}
          onHide={hideSupportForm}
          successAction={supportSuccessAction}
        />
        <ReportForm
          show={isReportFormOpen}
          onHide={hideReportForm}
          reportAction={(reportReason) => reportAction(reportReason)}
        />
      </>
    );
  }

  return board_id ? (
    <Button
      variant="contained"
      color="default"
      className="signup-cta"
      onClick={() => history.push("/signup")}
    >
      Create Account
    </Button>
  ) : null;
};

export default UserMenu;
