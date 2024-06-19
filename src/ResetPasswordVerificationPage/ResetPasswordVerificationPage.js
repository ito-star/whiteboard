import React, { useEffect, useState } from "react";
import { compose } from "redux";
import Alert from "@material-ui/lab/Alert";
import { useParams, useHistory } from "react-router-dom";
import { useCookie } from "react-use";
import { useConfirm } from "material-ui-confirm";
import { initFirebase, getCallableFbFunction } from "../utils";
import SimpleNavBar from "../SimpleNavBar";
import restrictedPage from "../auth/restrictedPage";
import Loader from "../components/Loader";

initFirebase();

const ResetPasswordVerificationPage = () => {
  const { id, token } = useParams();
  const history = useHistory();
  const [failed, setFailed] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const confirm = useConfirm();
  const [, , deleteCookie] = useCookie(`board-${id}`);
  const [, , deleteFailedAttemtsCounts] = useCookie(`board-${id}-failed`);

  useEffect(() => {
    const verifyPasswordTokenFunc = getCallableFbFunction(
      "boards-verifyPasswordToken"
    );

    verifyPasswordTokenFunc({ boardId: id, token })
      .then((res) => {
        if (res.data.reset) {
          deleteCookie();
          deleteFailedAttemtsCounts();
          confirm({
            title: "Your board password has been reset successfully.",
            description: (
              <>
                Use the <em>Board Settings</em> button to set a new password.
              </>
            ),
            confirmationText: "Return to Whatboard",
            cancellationText: "Board Settings",
            confirmationButtonProps: { className: "confirm-button" },
            dialogProps: {
              disableBackdropClick: true,
              disableEscapeKeyDown: true,
            },
          })
            .then(() => {
              history.replace(`/board/${id}`);
            })
            .catch(() => {
              history.replace(`/board/${id}#change-password`);
            });
        } else {
          setFailed(true);
        }
      })
      .catch(() => {
        setFailed(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, token, history, confirm, deleteCookie, deleteFailedAttemtsCounts]);

  let content;

  if (isLoading) {
    content = <Loader isFullScreen />;
  } else if (failed) {
    content = <Alert severity="error">Invaild Token Error</Alert>;
  }

  return (
    <>
      <SimpleNavBar />
      <div className="container-fluid">
        <div style={{ textAlign: "left" }}>
          <br />
          <br />
          <br />
          <div className="center margin-middle">{content}</div>
        </div>
      </div>
    </>
  );
};

const enhance = compose(restrictedPage());

export default enhance(ResetPasswordVerificationPage);
