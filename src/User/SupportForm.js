import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import { getCallableFbFunction } from "../utils";
import { supportFormSubjects } from "../constant";
import useUser from "../auth/useUser";

const SupportForm = ({ show, onHide, successAction }) => {
  const [supportSubject, setSupportSubject] = useState("");
  const [supportContent, setSupportContent] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const { user } = useUser();

  const hideModal = () => {
    if (onHide) {
      onHide();
    }
  };

  const submitModal = async (e) => {
    e.preventDefault();

    if (supportSubject === "" || supportContent === "") {
      setErrorMessage("Please Input Subject and Content");
      return;
    }

    setErrorMessage("");

    const func = getCallableFbFunction("support-sendSupport");
    const params = {
      email: "", // support@whatboard.app
      subject: supportSubject,
      content: supportContent,
      supporter: user && user.displayName ? user.displayName : "",
      supporterEmail: user && user.email ? user.email : "",
    };

    try {
      await func(params);
      successAction();
      hideModal();
    } catch (error) {
      setErrorMessage("Failed to send support. Please Try again.");
    }
  };

  const onSupportSubjectChange = (event) => {
    setSupportSubject(event.target.value);
  };

  return (
    <Dialog open={show} maxWidth="md" fullWidth onClose={hideModal}>
      <DialogTitle>How can we help?</DialogTitle>
      <DialogContent>
        {errorMessage !== "" && <Alert severity="error">{errorMessage}</Alert>}
        <br />
        <form id="support-form" onSubmit={submitModal}>
          <p>
            Please disable browser extensions before reporting your bug. Some
            browser extensions are incompatible with some sites.
          </p>
          <TextField
            autoComplete="off"
            id="support-subject"
            value={supportSubject}
            onChange={onSupportSubjectChange}
            onBlur={onSupportSubjectChange}
            label="Subject"
            select
            fullWidth
            variant="outlined"
          >
            {supportFormSubjects.map((subject) => {
              return (
                <MenuItem value={subject} key={subject}>
                  {subject}
                </MenuItem>
              );
            })}
          </TextField>
          <br />
          <br />
          <TextField
            fullWidth
            variant="outlined"
            multiline
            autoComplete="off"
            id="support-content"
            label="How can we help?"
            rows={4}
            value={supportContent}
            onChange={(e) => setSupportContent(e.target.value)}
          />
        </form>
        <p>We usually respond in a few hours.</p>
      </DialogContent>
      <DialogActions>
        <Button
          type="button"
          className="neutral-button margined-button"
          onClick={hideModal}
        >
          Close
        </Button>
        <Button
          onClick={submitModal}
          type="submit"
          form="support-form margined-button"
          className="confirm-button"
        >
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SupportForm;
