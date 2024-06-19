import React from "react";
import Alert from "react-bootstrap/Alert";
import _forEach from "lodash/forEach";

import { initFirebase } from "../utils";
import useUser from "../auth/useUser";
import SimpleNavBar from "../SimpleNavBar";

initFirebase();

export default function VerifyPage() {
  const { user, sendEmailVerification } = useUser();
  const [alerts, setAlerts] = React.useState({});
  const [working, setWorking] = React.useState({});

  /**
   * Add an alert to the dialog
   *
   * Parameters:
   *
   * id: A unique ID
   * props: Bootstrap Alert props. See https://react-bootstrap.github.io/components/alerts/
   * content: The alert content
   */
  const addAlert = (id, props, content) => {
    setAlerts({
      ...alerts,
      [id]: {
        props,
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

  const addWorking = (id, isWorking) => {
    setWorking({
      ...working,
      [id]: isWorking,
    });
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

  return (
    <>
      <SimpleNavBar />
      <div className="container-fluid">
        <div style={{ textAlign: "left" }}>
          <br />
          <br />
          <br />
          <div className="center margin-middle">
            {renderedAlerts}
            <p>In order to continue, you must verify your email address.</p>
            <p>
              An email containing instructions has been sent to {user.email}. If
              you did not receive this email, click the button below to re-send
              it.
            </p>
            <p>
              <button
                type="button"
                className="confirm-button"
                disabled={working["send-validation-email"]}
                onClick={sendValidationEmail}
              >
                Re-send validation email
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
