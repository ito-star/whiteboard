import React, { useState } from "react";
import { useSnackbar } from "notistack";
import { Button, Typography, Portal } from "@material-ui/core";
import clsx from "clsx";
import _omitBy from "lodash/omitBy";
import _isUndefined from "lodash/isUndefined";
import firebase from "firebase/compat/app";
import "firebase/database";
import { useSelector, useDispatch } from "react-redux";
import ColorPicker from "../ColorPicker";
import {
  setOriginHeaderColor,
  setOriginBodyColor,
  setHeaderColor,
  setBodyColor,
} from "../actions/setting";
import useUser from "../auth/useUser";
import Stack from "../components/Stack";

const CustomizeBoardForm = (props) => {
  const {
    notifySubmitting: notifySubmittingProp,
    boardId,
    onSuccess,
    portalContainer,
  } = props;
  const { user } = useUser();
  const [submitting, setSubmitting] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const dispatch = useDispatch();
  const headerColor = useSelector((state) => state.setting.headerColor);
  const bodyColor = useSelector((state) => state.setting.bodyColor);

  const notifySubmitting = (isSubmitting) => {
    setSubmitting(isSubmitting);

    if (notifySubmittingProp) {
      notifySubmittingProp(isSubmitting);
    }
  };

  const handleResetForm = () => {
    let targetHeaderColor = null;
    let targetBodyColor = null;

    if (boardId) {
      targetHeaderColor = user.branding.boardHeaderColor;
      targetBodyColor = user.branding.boardBodyColor;
    }

    dispatch(setHeaderColor(targetHeaderColor));
    dispatch(setBodyColor(targetBodyColor));
  };

  const handleSubmitForm = async (event) => {
    try {
      event.preventDefault();
      notifySubmitting(true);

      if (boardId) {
        let updates = {
          board_header_color: headerColor,
          boardBodyColor: bodyColor,
        };

        updates = _omitBy(updates, _isUndefined);
        await firebase
          .database()
          .ref(`whiteboards/${boardId}`)
          .update(updates, () => {
            dispatch(setOriginHeaderColor(headerColor));
            dispatch(setOriginBodyColor(bodyColor));
          });
      } else {
        let updates = {
          boardHeaderColor: headerColor,
          boardBodyColor: bodyColor,
        };

        updates = _omitBy(updates, _isUndefined);
        await firebase
          .database()
          .ref(`users/${user.wbid}/branding`)
          .update(updates, () => {
            dispatch(setOriginHeaderColor(headerColor));
            dispatch(setOriginBodyColor(bodyColor));
          });
      }

      notifySubmitting(false);
      if (onSuccess) onSuccess(undefined, true);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);

      enqueueSnackbar(err.toString(), {
        variant: "error",
      });

      notifySubmitting(false);
    }
  };

  const formId = `board-${boardId || "default"}-customize-form`;

  const resetButton = (
    <Button
      form={formId}
      className="neutral-button"
      variant="contained"
      type="reset"
      disabled={submitting}
    >
      Revert to Defaults
    </Button>
  );
  const saveButtonClasses = clsx({
    "confirm-button": true,
    // "customize-board_confirm": !portalContainer,
  });
  const saveButton = (
    <Button
      form={formId}
      variant="contained"
      color="primary"
      type="submit"
      className={saveButtonClasses}
      disabled={submitting}
    >
      Save
    </Button>
  );
  const buttons = (
    <>
      {resetButton}
      {saveButton}
    </>
  );

  return (
    <form id={formId} onSubmit={handleSubmitForm} onReset={handleResetForm}>
      <Typography component="h3" variant="h6">
        Header Color
      </Typography>
      <ColorPicker />

      <br />

      <Typography component="h3" variant="h6">
        Body Color
      </Typography>
      <ColorPicker body />

      {portalContainer && (
        <Portal container={portalContainer}>{buttons}</Portal>
      )}
      {!portalContainer && (
        <Stack className="customize-board-actions" direction="row" spacing={1}>
          {buttons}
        </Stack>
      )}
    </form>
  );
};

export default CustomizeBoardForm;
