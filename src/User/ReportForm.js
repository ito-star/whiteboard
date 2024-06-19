import React, { useState } from "react";
import Modal from "react-bootstrap/Modal";
import Alert from "@material-ui/lab/Alert";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormControl from "@material-ui/core/FormControl";
import FormLabel from "@material-ui/core/FormLabel";
import { ReportReasons } from "../constant";

const ReportForm = ({ show, onHide, reportAction }) => {
  const [errorMessage, setErrorMessage] = useState("");
  const [reportReason, setReportReason] = React.useState("-1");

  const hideModal = () => {
    if (onHide) {
      setErrorMessage("");
      onHide();
    }
  };

  const submitReport = async (e) => {
    e.preventDefault();

    if (reportReason === "-1") {
      setErrorMessage("Please Select the Report Reason");
      return;
    }

    if (reportAction) {
      const reasonString = ReportReasons[parseInt(reportReason, 10)];
      reportAction(reasonString);
      hideModal();
    }
  };

  const handleReportReasonChange = (event) => {
    setReportReason(event.target.value);
  };

  return (
    <Modal show={show} onHide={hideModal}>
      <Modal.Header>
        <Modal.Title>Report Board</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {errorMessage !== "" && <Alert severity="error">{errorMessage}</Alert>}
        <form id="support-form" onSubmit={submitReport}>
          <FormControl component="fieldset">
            <FormLabel component="legend" />
            <RadioGroup
              aria-label="gender"
              name="gender1"
              value={reportReason}
              onChange={handleReportReasonChange}
            >
              {ReportReasons.map((item, index) => (
                <FormControlLabel
                  key={item}
                  value={`${index}`}
                  control={<Radio />}
                  label={item}
                  index={index}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </form>
      </Modal.Body>
      <Modal.Footer>
        <button type="button" className="neutral-button" onClick={hideModal}>
          Cancel
        </button>
        <button type="submit" form="support-form" className="confirm-button">
          Report
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default ReportForm;
