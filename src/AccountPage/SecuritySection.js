import React from "react";
import { Button, TextField } from "@material-ui/core";
import clsx from "clsx";
import _keyBy from "lodash/keyBy";
import _forEach from "lodash/forEach";
import firebase from "firebase/compat/app";
import Alert from "react-bootstrap/Alert";
import useUser from "../auth/useUser";
import "firebase/compat/auth";

const SecuritySection = () => {
  const { user, updatePassword, sendEmailVerification } = useUser();
  const [working, setWorking] = React.useState({});
  const [alerts, setAlerts] = React.useState({});
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newUserPassword, setNewUserPassword] = React.useState("");
  const [newConfirmUserPassword, setNewConfirmUserPassword] = React.useState(
    ""
  );
  const [
    isSuccessfulPasswordChanged,
    setIsSuccessfulPasswordChanged,
  ] = React.useState(false);

  const providerMap = _keyBy(user.providerData, "providerId");
  const hasPassword = !!providerMap[
    firebase.auth.EmailAuthProvider.PROVIDER_ID
  ];

  const addWorking = (id, isWorking) => {
    setWorking({
      ...working,
      [id]: isWorking,
    });
  };

  // Update these alerts to it's own component
  const addAlert = (id, alertProps, content) => {
    setAlerts({
      ...alerts,
      [id]: {
        porps: alertProps,
        content,
      },
    });
  };

  const dismissAlert = (id) => {
    if (alerts[id]) {
      delete alerts[id];
      const newAlerts = {
        ...alerts,
      };
      setAlerts(newAlerts);
    }
  };

  const sendValidationEmail = async () => {
    const workId = "send-validation-email";

    addAlert(
      workId,
      {
        variant: "primary",
      },
      `Re-sending validation email...`
    );

    addWorking(workId, true);

    try {
      await sendEmailVerification();

      addAlert(
        workId,
        {
          variant: "success",
        },
        `The validation email has been successfully re-sent`
      );
    } catch (e) {
      // eslint-disable-next-line no-console
      addAlert(
        workId,
        {
          variant: "danger",
        },
        e.message
      );
    } finally {
      addWorking(workId, false);
    }
  };

  const onChangeNewPassword = (e) => {
    setNewUserPassword(e.target.value);
  };

  const onChangeNewConfirmPassword = (e) => {
    setNewConfirmUserPassword(e.target.value);
  };

  const onChangeCurrentPassword = (e) => {
    setCurrentPassword(e.target.value);
  };

  const renderedAlerts = [];
  _forEach(alerts, (alert, alertId) => {
    renderedAlerts.push(
      <Alert
        {...alert.props}
        key={alertId}
        dismissible
        onClose={() => {
          dismissAlert(alertId);
        }}
      >
        {alert.content}
      </Alert>
    );
  });

  const saveChanges = async () => {
    try {
      await updatePassword(
        currentPassword,
        newUserPassword,
        newConfirmUserPassword
      ).then(() => {
        setIsSuccessfulPasswordChanged(true);
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      addAlert(
        "form-error",
        {
          variant: "danger",
        },
        e.message
      );
    }
    setCurrentPassword("");
    setNewConfirmUserPassword("");
    setNewUserPassword("");
  };

  if (isSuccessfulPasswordChanged) {
    setTimeout(() => {
      setIsSuccessfulPasswordChanged(false);
    }, 10000);
  }

  const canSave = currentPassword && newUserPassword;

  return (
    <div className="security-sesction">
      <h1
        id="account"
        className="center account-header"
        style={{ fontSize: "36px" }}
      >
        Account
      </h1>
      <div className="center account-section">
        <span className="current-email-title">Current Email</span>
        <div className="current-email-container">
          <h3>{user.email}</h3>
          {user.emailVerified && (
            <span className="text-success">Verified Email</span>
          )}
          {!user.emailVerified && (
            <>
              <span className="text-danger">
                Email not verified &nbsp;&nbsp;
              </span>
              <Button
                className="confirm-button"
                disabled={working["send-validation-email"]}
                onClick={sendValidationEmail}
              >
                Re-send verification email
              </Button>
              <br />
              <br />
            </>
          )}
        </div>
        {hasPassword && (
          <>
            <div>
              <span className="password-title">Change Password</span>
              <div className="password-field-container">
                <TextField
                  className="material-input password-field"
                  value={currentPassword}
                  onChange={onChangeCurrentPassword}
                  type="password"
                  label="Current Password"
                />
              </div>
              <div className="password-field-container">
                <TextField
                  className="material-input password-field"
                  value={newUserPassword}
                  onChange={onChangeNewPassword}
                  type="password"
                  label="New Password"
                />
              </div>
              <div className="password-field-container">
                <TextField
                  className="material-input password-field"
                  onChange={onChangeNewConfirmPassword}
                  value={newConfirmUserPassword}
                  type="password"
                  label="Confirm New Password"
                />
              </div>
              {renderedAlerts}
              {isSuccessfulPasswordChanged && (
                <span className="text-success">
                  Password succesfully changed
                </span>
              )}
            </div>
          </>
        )}
      </div>
      <div className="center final-section">
        <Button
          className={clsx("confirm-button", !canSave && "greyed")}
          onClick={saveChanges}
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default SecuritySection;
