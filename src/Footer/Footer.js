import React, { useState } from "react";
import Snackbar from "@material-ui/core/Snackbar";
import Alert from "@material-ui/lab/Alert";
import { Link } from "react-router-dom";
import SupportForm from "../User/SupportForm";

import "./Footer.scss";

export default function Footer() {
  const [isSupportFormOpen, setIsSupportFormOpen] = useState();
  const [errMessage, setErrMessage] = useState("");
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isError, setError] = useState(false);

  const showSupportForm = () => {
    setIsSupportFormOpen(true);
  };

  const supportSuccessAction = () => {
    setErrMessage("Your message has been received.");
    setError(false);
    setIsAlertOpen(true);
  };

  const hideSupportForm = () => {
    setIsSupportFormOpen(false);
  };

  const handleCloseAlert = () => {
    setIsAlertOpen(false);
  };

  return (
    <>
      <SupportForm
        show={isSupportFormOpen}
        onHide={hideSupportForm}
        successAction={supportSuccessAction}
      />

      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        open={isAlertOpen}
        autoHideDuration={2000}
        onClose={handleCloseAlert}
      >
        <Alert
          onClose={handleCloseAlert}
          variant="filled"
          severity={isError ? "error" : "success"}
        >
          {errMessage}
        </Alert>
      </Snackbar>
      <div className="footer">
        <div className="links">
          <Link to="/acceptable-use">Acceptable Use</Link>
          <Link to="/terms">Terms</Link>
          <Link className="logo" to="/">
            <img alt="logo" src="/logo.svg" />
          </Link>

          <button type="button" onClick={showSupportForm}>
            Support
          </button>
          <Link to="/privacy">Privacy</Link>
        </div>
      </div>
    </>
  );
}
