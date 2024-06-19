import React, { useCallback } from "react";
import { Button, Dialog, DialogContent, Typography } from "@material-ui/core";
import AddIcon from "@material-ui/icons/AddOutlined";
import useUser from "../auth/useUser";
import { DialogTitle, DialogActions } from "./NewBoardUiAnnoncement.styles";

const NewBoardUiAnnoncement = React.forwardRef(function NewBoardUiAnnoncement(
  props,
  ref
) {
  const { onClose: onCloseProp } = props;
  const { resetTutorial, setHasSeenNewButtonUiAnnouncement } = useUser();

  const onClose = useCallback(
    async (...args) => {
      onCloseProp(...args);
      await setHasSeenNewButtonUiAnnouncement();
    },
    [onCloseProp, setHasSeenNewButtonUiAnnouncement]
  );

  const hideModal = useCallback(
    (event) => {
      onClose(event, "closeButtonClick");
    },
    [onClose]
  );

  const handleResetTutorial = useCallback(
    async (event) => {
      hideModal(event);
      await resetTutorial();
    },
    [hideModal, resetTutorial]
  );

  return (
    <Dialog {...props} ref={ref}>
      <DialogTitle CloseButtonProps={{ onClick: hideModal }}>
        What? Where did my buttons go?
      </DialogTitle>
      <DialogContent>
        <Typography>
          See the top right header menu for Board Settings, Tidy, Freeze, and
          Share.
        </Typography>
        <Typography>
          See the top right (<AddIcon />) button for new Board and Board type
          options.
        </Typography>
        <Typography>
          Also new: See the top right avatar menu for Download Board and account
          settings.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button type="button" className="neutral-button" onClick={hideModal}>
          Skip Tutorial
        </Button>
        <Button
          type="button"
          className="confirm-button"
          onClick={handleResetTutorial}
        >
          Show Tutorial
        </Button>
      </DialogActions>
    </Dialog>
  );
});

NewBoardUiAnnoncement.propTypes = Dialog.propTypes;

export default NewBoardUiAnnoncement;
