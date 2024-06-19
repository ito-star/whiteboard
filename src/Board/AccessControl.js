import React from "react";
import Dialog from "@material-ui/core/Dialog";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import { useCookie } from "react-use";
import { useSnackbar } from "notistack";
import { useConfirm } from "material-ui-confirm";
import Loader from "../components/Loader";
import { getCallableFbFunction } from "../utils";
import "./AccessControl.scss";

const BoardAccessControl = ({
  boardId,
  onUnlock,
  isModal = false,
  isModalOpen = false, // only valid when isModal === true
  onModalHide = () => {}, // only valid when isModal === true
}) => {
  const [error, setError] = React.useState();
  const [password, setPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const [, updateCookie] = useCookie(`board-${boardId}`);
  const [
    failedAttempts,
    updateFailedAttempts,
    deleteFailedAttempts,
  ] = useCookie(`board-${boardId}-attempts`);
  const confirm = useConfirm();

  const handleResetPassword = async () => {
    try {
      setSubmitting(true);
      const resetBoardPasswordFunc = getCallableFbFunction(
        "boards-resetPassword"
      );

      if (boardId) {
        await resetBoardPasswordFunc({ boardId });
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);

      enqueueSnackbar(err.toString(), {
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClickReset = () => {
    confirm({
      title: "Are you sure you want to reset the board password?",
      description:
        "If you proceed, a confirmation email with a reset link will be sent to your email address.",
      confirmationText: "Reset",
    })
      .then(() => {
        handleResetPassword();
      })
      .catch(() => null);
  };

  const onSubmitPassword = async (event) => {
    event.preventDefault();
    const unlockBoardFunc = getCallableFbFunction("boards-unlockBoard");
    setSubmitting(true);
    unlockBoardFunc({ boardId, password })
      .then((res) => {
        onUnlock(res.data.token);
        setSubmitting(false);
        updateCookie(res.data.token);
        deleteFailedAttempts();
      })
      .catch((err) => {
        updateFailedAttempts(Number(failedAttempts || 0) + 1);
        setSubmitting(false);
        setError(err);
      });
  };

  const renderControl = () => {
    return (
      <div className="access-control-wrapper">
        {submitting && <Loader />}
        <form className="control-content" onSubmit={onSubmitPassword}>
          <h6>Enter Your Password to Access this Whatboard</h6>
          <TextField
            variant="outlined"
            type="password"
            margin="dense"
            fullWidth
            value={password}
            onChange={(evt) => {
              setPassword(evt.target.value);
              setError(null);
            }}
            helperText={error && "Password is incorrect."}
            error={!!error}
          />
          <p className="content-description">
            We do not have access to your password and cannot recover it if it
            has been lost!
          </p>
          {Number(failedAttempts || 0) > 5 && (
            <Button
              color="secondary"
              className="reset-link"
              onClick={handleClickReset}
            >
              Forgot your password? Click here to reset!
            </Button>
          )}
          <Button
            variant="contained"
            color="primary"
            type="submit"
            className="submit-btn"
          >
            Submit
          </Button>
        </form>
      </div>
    );
  };

  if (isModal) {
    return (
      <Dialog
        open={isModalOpen}
        onClose={onModalHide}
        classes={{ paper: "access-control-modal" }}
      >
        {renderControl()}
      </Dialog>
    );
  }

  return renderControl();
};

export default BoardAccessControl;
