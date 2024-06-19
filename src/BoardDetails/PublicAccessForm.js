import firebase from "firebase/compat/app";
import "firebase/compat/database";
import React, { useState, useRef } from "react";
import clsx from "clsx";
import { Form } from "react-bootstrap";
import { IMaskMixin } from "react-imask";
import {
  Button,
  TextField,
  FormHelperText,
  IconButton,
  Portal,
} from "@material-ui/core";
import {
  FileCopyOutlined as FileCopyIcon,
  DeleteOutlineOutlined as DeleteIcon,
} from "@material-ui/icons";
import { useConfirm } from "material-ui-confirm";
import { useSnackbar } from "notistack";
import { createUUID } from "../utils";
import access from "../access";
import AuthCheck from "../auth/AuthCheck";
import Loader from "../components/Loader";
import UpgradeOffer from "../User/UpgradeOffer";
import "./PublicAccessForm.scss";

const MixinInput = IMaskMixin(({ isUniqueFriendlyUrl, ...iMaskMixinProps }) => (
  <>
    <TextField {...iMaskMixinProps} />
    {!isUniqueFriendlyUrl && (
      <FormHelperText error id="component-error-text">
        Error, Friendly URL is invalid. Please submit a unique name
      </FormHelperText>
    )}
  </>
));

const PublicAccessForm = ({
  board_id,
  board_name,
  board_members,
  unique_url,
  friendly_url = null,
  publicURLUpdated,
  notifySubmitting: notifySubmittingProp,
  portalContainer,
}) => {
  const [friendlyUrl, setFriendlyUrl] = useState(friendly_url);
  const [isUniqueFriendlyUrl, setIsUniqueFriendlyUrl] = useState(true);
  const [isFriendlyUrlSubmitted, setIsFriendlyUrlSubmitted] = useState(
    !!friendly_url
  );
  const [uniqueUrl, setUniqueUrl] = useState(unique_url);
  const [uniqueUrlSubmitted, setUniqueUrlSubmitted] = useState(!!uniqueUrl);
  const [submitting, setSubmitting] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const baseUrl = `${window.location.origin}/b/`;
  const pattern = `${baseUrl.replace(/(a|0)/g, "\\$1")}$p`;
  const inputElemRef = useRef();
  const confirm = useConfirm();

  const canMakeBoardsPublic = (currentUser) => {
    const board = {
      board_id,
      board_name,
      board_members,
      unique_url: uniqueUrl,
    };

    return access.canMakeBoardPublic(board, currentUser);
  };

  const validateFriendlyUrl = (value) => {
    if (value && (value.length < 4 || value.length > 23)) {
      inputElemRef.current.setCustomValidity(
        "Friendly URL must be between 4 and 23 characters"
      );

      inputElemRef.current.reportValidity();

      return false;
    }

    inputElemRef.current.setCustomValidity("");

    return true;
  };

  const notifySubmitting = (isSubmitting) => {
    setSubmitting(isSubmitting);

    if (notifySubmittingProp) {
      notifySubmittingProp(isSubmitting);
    }
  };

  const copyUrl = (source) => {
    navigator.clipboard.writeText(source);

    enqueueSnackbar("Copied to clipboard", {
      variant: "success",
    });
  };

  const disablePublicAccess = async () => {
    try {
      notifySubmitting(true);

      const updates = {};
      const uniqueUrlHash = null;

      setUniqueUrl(uniqueUrlHash);
      setIsFriendlyUrlSubmitted(false);
      setFriendlyUrl(null);
      setUniqueUrlSubmitted(false);

      updates[`whiteboards/${board_id}/friendly_url`] = uniqueUrlHash;
      updates[`whiteboards/${board_id}/unique_url`] = uniqueUrlHash;
      await firebase.database().ref().update(updates);

      if (publicURLUpdated) {
        publicURLUpdated();
      }

      enqueueSnackbar("Public access succesfully disabled", {
        variant: "success",
      });
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

  const removeFriendlyUrl = async () => {
    try {
      notifySubmitting(true);

      const updates = {};

      setIsFriendlyUrlSubmitted(false);
      setFriendlyUrl(null);

      updates[`whiteboards/${board_id}/friendly_url`] = null;
      await firebase.database().ref().update(updates);

      if (publicURLUpdated) {
        publicURLUpdated();
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

  const handleSubmitForm = async (event) => {
    try {
      event.preventDefault();

      notifySubmitting(true);

      let uniqueUrlHash = uniqueUrl;

      if (!uniqueUrlHash) {
        uniqueUrlHash = createUUID();
      }

      const whiteboardUpdates = {};

      if (friendlyUrl) {
        const friendlyUrlSnap = await firebase
          .database()
          .ref(`/friendlyUrl/${friendlyUrl}`)
          .once("value");
        const friendlyUrlObj = friendlyUrlSnap.val();

        if (friendlyUrlObj && board_id !== friendlyUrlObj.board_id) {
          setIsUniqueFriendlyUrl(false);
          setFriendlyUrl(null);
          return;
        }
      }

      whiteboardUpdates[`whiteboards/${board_id}/unique_url`] = uniqueUrlHash;
      whiteboardUpdates[`whiteboards/${board_id}/friendly_url`] =
        friendlyUrl || null;

      await firebase.database().ref().update(whiteboardUpdates);

      setIsFriendlyUrlSubmitted(!!friendlyUrl);
      setUniqueUrlSubmitted(true);
      setUniqueUrl(uniqueUrlHash);
      setIsUniqueFriendlyUrl(true);

      if (publicURLUpdated) {
        publicURLUpdated();
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

  const accessFallback = (
    <UpgradeOffer
      prefix="Want to make this board publicly accessible?"
      targetRole="premium"
    />
  );

  const handleRemovePublicAccessClick = () => {
    confirm({
      title: "Are you sure you want to disable public access?",
      description:
        "Disabling public access will remove both your friendly shared URL (if you made one) and the system generated URL, making the board private.",
      confirmationText: "Disable",
    })
      .then(() => disablePublicAccess())
      .catch(() => {});
  };

  const renderFriendlyUrlInput = () => {
    return (
      <div>
        <MixinInput
          name="friendly_url"
          value={friendlyUrl}
          mask={pattern}
          blocks={{
            $p: {
              mask: /^\w{0,23}$/,
            },
          }}
          label="Friendly URL (optional)"
          helperText="Type a word or phrase so the URL you send is friendly/familiar
          to the recipient"
          className="invite-form-create-custom-url--input"
          unmask
          lazy={false}
          onAccept={(value) => {
            validateFriendlyUrl(value);
            setFriendlyUrl(value);
          }}
          inputRef={(el) => {
            inputElemRef.current = el;
            return el;
          }}
          isUniqueFriendlyUrl={isUniqueFriendlyUrl}
        />
      </div>
    );
  };

  const renderUniqueUrlReadOnly = () => {
    let data = null;

    if (uniqueUrl || (friendlyUrl && isFriendlyUrlSubmitted)) {
      data = (
        <>
          <Form.Row className="readonly-url-row">
            <Form.Control
              autoComplete="off"
              value={`${window.location.origin}/readonlyboard/${board_id}?invitation=${uniqueUrl}`}
              readOnly
            />

            {uniqueUrl && uniqueUrlSubmitted && (
              <IconButton
                onClick={() =>
                  copyUrl(
                    `${window.location.origin}/readonlyboard/${board_id}?invitation=${uniqueUrl}`
                  )
                }
              >
                <FileCopyIcon color="primary" />
              </IconButton>
            )}
          </Form.Row>
        </>
      );
    }

    return data;
  };

  const renderFriendlyUrlReadOnly = () => {
    let data = null;

    if (friendly_url || (friendlyUrl && isFriendlyUrlSubmitted)) {
      data = (
        <>
          <Form.Row className="readonly-url-row">
            <Form.Control
              autoComplete="off"
              value={`${window.location.origin}/b/${friendlyUrl}`}
              readOnly
            />

            <IconButton
              onClick={() =>
                copyUrl(`${window.location.origin}/b/${friendlyUrl}`)
              }
            >
              <FileCopyIcon color="primary" />
            </IconButton>

            <IconButton onClick={removeFriendlyUrl}>
              <DeleteIcon color="primary" />
            </IconButton>
          </Form.Row>
        </>
      );
    }

    return data;
  };

  const formId = `board-${board_id}-public-access-form`;

  const renderPublicAccessButtons = () => {
    const buttons = (
      <>
        {uniqueUrl && (
          <Button
            form={formId}
            className={clsx({
              "cancel-button": true,
              "invite-form_save-button": !!portalContainer,
            })}
            onClick={handleRemovePublicAccessClick}
            type="button"
            align="right"
          >
            Disable public access
          </Button>
        )}
        {(!uniqueUrl || (friendlyUrl && !isFriendlyUrlSubmitted)) && (
          <Button
            form={formId}
            className={clsx({
              "confirm-button": true,
              "public-access-form-button-container_save": !!portalContainer,
              "invite-form_save-button": !!portalContainer,
            })}
            type="submit"
            align="right"
          >
            {!uniqueUrl ? "Enable public access" : "Save friendly URL"}
          </Button>
        )}
      </>
    );

    return (
      <>
        {portalContainer && (
          <Portal container={portalContainer}>{buttons}</Portal>
        )}
        {!portalContainer && (
          <div className="public-access-form-button-container">{buttons}</div>
        )}
      </>
    );
  };

  return (
    <AuthCheck
      accessCheck={canMakeBoardsPublic}
      accessFallback={accessFallback}
    >
      <form onSubmit={handleSubmitForm} id={formId}>
        {submitting && (
          <Loader id="app-loader" type="bars" color="#2c387e" isFullScreen />
        )}
        <Form.Group>
          {(!friendly_url || !isFriendlyUrlSubmitted) &&
            renderFriendlyUrlInput()}
          <div>
            <div className="invite-form-public-url--submit" />
          </div>
          {renderFriendlyUrlReadOnly()}
          {renderUniqueUrlReadOnly()}
          {renderPublicAccessButtons()}
        </Form.Group>
      </form>
    </AuthCheck>
  );
};

export default PublicAccessForm;
