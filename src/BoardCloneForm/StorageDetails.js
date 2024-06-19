import React, { useCallback } from "react";
import PropTypes from "prop-types";
import IconButton from "@material-ui/core/IconButton";
import Button from "@material-ui/core/Button";
import HelpIcon from "@material-ui/icons/HelpOutlineOutlined";
import Tooltip from "@material-ui/core/Tooltip";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Accordion from "@material-ui/core/Accordion";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import AccordionDetails from "@material-ui/core/AccordionDetails";
import Typography from "@material-ui/core/Typography";
import { useModal } from "mui-modal-provider";
import { DangerText, SuccessText } from "./BoardCloneForm.styles";

export const StorageDetailsDialog = React.forwardRef(
  function StorageDetailsDialog(props, ref) {
    const { formId, ...dialogProps } = props;
    const { onClose } = dialogProps;

    const handleCloseButtonClick = useCallback(
      (event) => {
        onClose(event, "closeButtonClick");
      },
      [onClose]
    );

    return (
      <Dialog ref={ref} {...dialogProps}>
        <DialogTitle>File Storage Usage Details</DialogTitle>
        <DialogContent>
          <Accordion>
            <AccordionSummary
              aria-controls={`${formId}-your-files-content`}
              id={`${formId}-your-files-header`}
            >
              <Typography>Files Uploaded to the Board by You</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>
                Files in this board that were uploaded by you{" "}
                <SuccessText>WILL NOT</SuccessText> be counted against your
                storage usage any more than they already are.
              </Typography>
            </AccordionDetails>
          </Accordion>
          <Accordion>
            <AccordionSummary
              aria-controls={`${formId}-other-files-content`}
              id={`${formId}-other-files-header`}
            >
              <Typography>
                Files Uploaded to the Board by Other Users
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography component="div">
                <p>
                  For files uploaded to the board by other users, you have two
                  options:
                </p>
                <ol>
                  <li>Duplicate the files uploaded by other users</li>
                  <li>Do not duplicate the files uploaded by other users</li>
                </ol>
                <p>
                  If you choose to duplicate the files uploaded to this board by
                  other users, then the duplicates <DangerText>WILL</DangerText>{" "}
                  be counted against your storage usage. You will also be
                  protected should the original file be deleted. You must have
                  enough storage space to accomodate all of the duplicates.
                </p>
                <p>
                  If you choose not to duplicate the files uploaded to this
                  board by other users, then they{" "}
                  <SuccessText>WILL NOT</SuccessText> be counted against your
                  storage usage. However, you will not be protected should the
                  original file be deleted.
                </p>
                <p>
                  In both cases, removing any of these files from the new board
                  will not affect the file in this board.
                </p>
              </Typography>
            </AccordionDetails>
          </Accordion>
        </DialogContent>
        <DialogActions>
          <Button
            type="button"
            className="confirm-button"
            onClick={handleCloseButtonClick}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
);

StorageDetailsDialog.propTypes = {
  ...Dialog.propTypes,
  formId: PropTypes.string.isRequired,
};

export const StorageDetailsHelpIcon = React.forwardRef(
  function StorageDetailsHelpIcon(props, ref) {
    const { formId } = props;
    const { showModal } = useModal();

    const handleIconClick = useCallback(() => {
      showModal(StorageDetailsDialog, {
        formId,
      });
    }, [showModal, formId]);

    return (
      <Tooltip ref={ref} title="Click here for storage usage details">
        <IconButton onClick={handleIconClick}>
          <HelpIcon />
        </IconButton>
      </Tooltip>
    );
  }
);

StorageDetailsHelpIcon.propTypes = {
  formId: PropTypes.string.isRequired,
};
