import React, { useState } from "react";
import styled from "styled-components";
import {
  Box,
  FormControl,
  Input,
  InputLabel,
  InputAdornment,
  IconButton,
  Button,
  FormHelperText,
  Portal,
} from "@material-ui/core";
import { useDispatch, useSelector } from "react-redux";
import { useConfirm } from "material-ui-confirm";
import { useSnackbar } from "notistack";
import {
  VisibilityOffOutlined as VisibilityOff,
  VisibilityOutlined as Visibility,
} from "@material-ui/icons";
import { getCallableFbFunction } from "../utils";
import access from "../access";
import AuthCheck from "../auth/AuthCheck";
import Loader from "../components/Loader";
import UpgradeOffer from "../User/UpgradeOffer";
import useUser from "../auth/useUser";
import { setBoardProtected } from "../actions/setting";

const Form = styled.form`
  & .MuiFormControl-root {
    margin-bottom: 1rem;
  }
`;

const PasswordForm = ({
  boardId,
  board_members,
  boardName,
  notifySubmitting: notifySubmittingProp,
  portalContainer,
}) => {
  const { isSecured } = useSelector((state) => state.setting);
  const [showPassword, setShowPassword] = useState(false);
  const [formValues, setFormValues] = useState({
    oldPassword: "",
    password: "",
    confirmPassword: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [showError, setShowError] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const confirm = useConfirm();
  const dispatch = useDispatch();
  const { user } = useUser();
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setShowError(false);
    setFormValues({
      ...formValues,
      [name]: value,
    });
  };

  const notifySubmitting = (isSubmitting) => {
    setSubmitting(isSubmitting);

    if (notifySubmittingProp) {
      notifySubmittingProp(isSubmitting);
    }
  };

  const canProtectBoard = () => {
    const board = {
      boardId,
      board_members,
    };

    return access.canProtectBoard(board, user);
  };

  const handleResetPassword = async () => {
    try {
      notifySubmitting(true);
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
      notifySubmitting(false);
    }
  };

  const handleSubmitPassword = async (evt) => {
    try {
      evt.preventDefault();
      notifySubmitting(true);
      const { password, oldPassword, confirmPassword } = formValues;
      const setBoardPasswordFunc = getCallableFbFunction(
        "boards-setBoardPassword"
      );

      if (password) {
        if (password !== confirmPassword) {
          setShowError(true);

          return;
        }

        await setBoardPasswordFunc({
          boardId,
          newPassword: password,
          oldPassword,
        });

        dispatch(setBoardProtected(true));

        setFormValues({
          oldPassword: "",
          password: "",
          confirmPassword: "",
        });
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      enqueueSnackbar(err.toString(), {
        variant: "error",
      });
    } finally {
      notifySubmitting(false);
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

  const accessFallback = (
    <UpgradeOffer prefix="Want to password protect this board?" />
  );

  const formId = `board-${boardId}-password-form`;

  const passwordButtons = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: isSecured ? "space-between" : "flex-end",
        width: "100%",
      }}
    >
      {isSecured && (
        <Button color="secondary" onClick={handleClickReset}>
          Forgot your password? Click here to reset!
        </Button>
      )}
      <div>
        <Button
          form={formId}
          variant="contained"
          color="primary"
          type="submit"
          className="confirm-button"
        >
          {isSecured ? "Save" : "Lock"}
        </Button>
      </div>
    </div>
  );

  return (
    <AuthCheck accessCheck={canProtectBoard} accessFallback={accessFallback}>
      <Form id={formId} onSubmit={handleSubmitPassword}>
        {submitting && (
          <Loader id="app-loader" type="bars" color="#2c387e" isFullScreen />
        )}
        {/*
        This username field is here mainly to assist password managers
        See https://www.chromium.org/developers/design-documents/create-amazing-password-forms
        */}
        <Input
          type="text"
          name="username"
          autoComplete="username"
          value={`Whatboard "${boardName}"`}
          readOnly
          hidden
        />
        {isSecured && (
          <FormControl fullWidth variant="standard">
            <InputLabel htmlFor="board-old-password">
              Current Password
            </InputLabel>
            <Input
              id="board-old-password"
              name="oldPassword"
              type={showPassword ? "text" : "password"}
              value={formValues.oldPassword}
              onChange={handleInputChange}
              autoComplete="current-password"
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    onMouseDown={(evt) => evt.preventDefault()}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              }
            />
          </FormControl>
        )}
        <FormControl fullWidth variant="standard" error={showError}>
          <InputLabel htmlFor="board-new-password">New Password</InputLabel>
          <Input
            id="board-new-password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={formValues.password}
            onChange={handleInputChange}
            autoComplete="new-password"
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  onMouseDown={(evt) => evt.preventDefault()}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            }
          />
        </FormControl>
        <FormControl fullWidth variant="standard" error={showError}>
          <InputLabel htmlFor="board-new-password-confirm">
            Confirm New Password
          </InputLabel>
          <Input
            id="board-new-password-confirm"
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            value={formValues.confirmPassword}
            onChange={handleInputChange}
            autoComplete="new-password"
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  onMouseDown={(evt) => evt.preventDefault()}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            }
          />
          {showError && (
            <FormHelperText>
              &quot;New Password&quot; and &quot;Confirm New Password&quot;
              fields must match.
            </FormHelperText>
          )}
        </FormControl>
        {portalContainer && (
          <Portal container={portalContainer}>{passwordButtons}</Portal>
        )}
        {!portalContainer && (
          <Box className="password-actions">{passwordButtons}</Box>
        )}
      </Form>
    </AuthCheck>
  );
};

export default PasswordForm;
