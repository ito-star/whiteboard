import React, { useCallback, useState, useRef } from "react";
import {
  Box,
  Tabs,
  Tab,
  Dialog,
  DialogContent,
  DialogActions,
} from "@material-ui/core";
import { useLocation, useHistory } from "react-router-dom";
import InviteForm from "../InviteForm";
import PasswordForm from "./PasswordForm";
import PublicAccessForm from "./PublicAccessForm";
import { DialogTitle, DialogTabs } from "./BoardDetails.styles";
import CustomizeBoardForm from "./CustomizeBoardForm";
import "./BoardDetails.scss";

const Mousetrap = require("mousetrap");
require("mousetrap/plugins/pause/mousetrap-pause");

const a11yProps = (index) => {
  return {
    id: `board-detail-tab-${index}`,
    "aria-controls": `board-detail-tabpanel-${index}`,
  };
};

const TabPanel = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`board-detail-tabpanel-${index}`}
      aria-labelledby={`board-detail-tab-${index}`}
      {...other}
    >
      {value === index && <Box p={3}>{children}</Box>}
    </div>
  );
};

const BoardDetails = React.forwardRef((props, ref) => {
  const {
    formProps,
    publicURLUpdated,
    board_id,
    board_name,
    board_members,
    isSecured,
    ...dialogProps
  } = props;
  const [isSubmitting, setSubmitting] = useState(false);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const portalContainerRef = useRef();
  const { hash } = useLocation();
  const history = useHistory();
  const { onClose: onCloseDialog } = dialogProps;

  React.useEffect(() => {
    if (hash === "#change-password") {
      setActiveTabIndex(1);
    }
  }, [hash]);

  const getPortalContainer = () => {
    return portalContainerRef.current;
  };

  const onClose = useCallback(
    (...args) => {
      onCloseDialog(...args);
      Mousetrap.unpause();

      if (hash === "#change-password") {
        history.replace(`/board/${board_id}`);
      }
    },
    [onCloseDialog, hash, history, board_id]
  );

  const hideModal = useCallback(
    (event) => {
      onClose(event, "closeButtonClick");
    },
    [onClose]
  );

  const notifySubmitting = (submitting) => {
    if (props.notifySubmitting) {
      props.notifySubmitting(submitting);
    }

    setSubmitting(submitting);
  };

  const handleTabChange = (event, index) => {
    setActiveTabIndex(index);
  };

  const onSuccess = (result, closeModal) => {
    if (closeModal) {
      hideModal();
    }
  };

  return (
    <Dialog
      className="board-detail-dialog"
      open
      maxWidth="md"
      ref={ref}
      {...dialogProps}
      onClose={onClose}
      disableBackdropClick={isSubmitting}
      disableEscapeKeyDown={isSubmitting}
    >
      <DialogTitle
        CloseButtonProps={{ onClick: hideModal, disabled: isSubmitting }}
      >
        Board Details for {board_name}
      </DialogTitle>
      <DialogTabs>
        <Tabs
          value={activeTabIndex}
          onChange={handleTabChange}
          aria-label="board detail tabs"
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth" // This can be changed to "scrollable" if we ever add more tabs, and those tabs exceed the available space
        >
          <Tab label="Collaborators" {...a11yProps(0)} />
          <Tab label="Password Protection" {...a11yProps(1)} />
          <Tab label="Public Access" {...a11yProps(2)} />
          <Tab label="Customize Board" {...a11yProps(3)} />
        </Tabs>
      </DialogTabs>
      {/**
       * Why is <DialogActions> first? Because it's being used as a portal container for
       * form buttons, it must exist in the DOM/React tree before any of those buttons are
       * rendered. CSS controls the visual positioning so that the buttons still appear
       * at the bottom of the dialog.
       */}
      <DialogActions ref={portalContainerRef} />
      <DialogContent className="board-detail-content">
        <TabPanel value={activeTabIndex} index={0}>
          <InviteForm
            {...props}
            formProps={formProps}
            notifySubmitting={notifySubmitting}
            portalContainer={activeTabIndex === 0 && getPortalContainer}
          />
        </TabPanel>
        <TabPanel value={activeTabIndex} index={1}>
          <PasswordForm
            isSecured={isSecured}
            boardId={board_id}
            boardName={board_name}
            board_members={board_members}
            notifySubmitting={notifySubmitting}
            portalContainer={activeTabIndex === 1 && getPortalContainer}
          />
        </TabPanel>
        <TabPanel value={activeTabIndex} index={2}>
          <PublicAccessForm
            {...props}
            publicURLUpdated={publicURLUpdated}
            notifySubmitting={notifySubmitting}
            portalContainer={activeTabIndex === 2 && getPortalContainer}
          />
        </TabPanel>
        <TabPanel value={activeTabIndex} index={3}>
          <CustomizeBoardForm
            boardId={board_id}
            notifySubmitting={notifySubmitting}
            onSuccess={onSuccess}
            portalContainer={activeTabIndex === 3 && getPortalContainer}
          />
        </TabPanel>
      </DialogContent>
    </Dialog>
  );
});

export default BoardDetails;
