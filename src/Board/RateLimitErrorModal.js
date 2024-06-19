import React from "react";
import { useHistory } from "react-router-dom";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@material-ui/core";

const RateLimitErrorModal = React.forwardRef((props, ref) => {
  const history = useHistory();
  const { isDashboard, ...dialogProps } = props;
  const handleClickConfirm = (evt) => {
    if (isDashboard) {
      dialogProps.onClose(evt, "closeButtonClick");
    } else {
      history.push("/");
    }
  };

  return (
    <Dialog
      ref={ref}
      {...dialogProps}
      disableBackdropClick={!isDashboard}
      disableEscapeKeyDown={!isDashboard}
    >
      <DialogTitle>What?</DialogTitle>
      <DialogContent>
        Sorry, but you have loaded (or re-loaded) this content in excess of the
        limits our system has set to protect our users. If you feel this message
        is in error, or if you want to discuss an enterprise plan, please use
        the Contact Us menu option in the top right (your avatar). Thank you!
      </DialogContent>
      <DialogActions>
        <Button
          type="button"
          className="confirm-button"
          onClick={handleClickConfirm}
        >
          {isDashboard ? "Close" : "Go to Dashboard"}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

export default RateLimitErrorModal;
