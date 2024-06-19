import React, { useCallback } from "react";
import PropTypes from "prop-types";
import { Dashboard } from "@uppy/react";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";

const UppyPickerOnlyDashboardModal = React.forwardRef((props, ref) => {
  const {
    DashboardProps: inDashboardProps,
    DialogProps: inDialogProps,
    onDone,
  } = props;

  const DashboardProps = {
    ...inDashboardProps,
    hideUploadButton: true,
  };

  const DialogProps = {
    ...inDialogProps,
    maxWidth: false,
  };

  const { onClose } = DialogProps;

  const handleCancelButtonClick = useCallback(
    (event) => {
      if (onClose) {
        onClose(event, "cancelButtonClick");
      }
    },
    [onClose]
  );

  const handleDoneButtonClick = useCallback(
    (event) => {
      if (onClose) {
        onClose(event, "doneButtonClick");
      }

      onDone();
    },
    [onClose, onDone]
  );

  return (
    <Dialog {...DialogProps}>
      <Dashboard {...DashboardProps} ref={ref} />
      <DialogActions>
        <Button
          variant="contained"
          className="neutral-button"
          onClick={handleCancelButtonClick}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          className="confirm-button"
          onClick={handleDoneButtonClick}
        >
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
});

UppyPickerOnlyDashboardModal.propTypes = {
  DashboardProps: PropTypes.shape(Dashboard.propTypes),
  DialogProps: PropTypes.shape(Dialog.propTypes),
  onDone: PropTypes.func.isRequired,
};

UppyPickerOnlyDashboardModal.defaultProps = {
  DashboardProps: {},
  DialogProps: {},
};

export default UppyPickerOnlyDashboardModal;
