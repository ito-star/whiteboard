import React, { useState, useEffect } from "react";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/database";
import { Link } from "react-router-dom";
import FirebaseAuth from "react-firebaseui/FirebaseAuth";
import Alert from "@material-ui/lab/Alert";
import "./AcceptInvite.scss";

import SimpleNavBar from "../SimpleNavBar";
import { initFirebase } from "../utils";
import useUser from "../auth/useUser";
import useFirebaseUiConfig from "../auth/useFirebaseUiConfig";
import Loader from "../components/Loader";

initFirebase();
const dbPath = `invite-emails/`;

const retrieveBoardData = async (props) => {
  const { match } = props;
  const ref = firebase.database().ref(dbPath + match.params.id);
  const boardData = (await ref.once("value")).val();

  return boardData;
};

export default function AcceptInvite(props) {
  const { user: currentUser, loadingUser } = useUser();
  const [boardData, setBoardData] = useState();
  const defaultUiConfig = useFirebaseUiConfig();

  useEffect(() => {
    retrieveBoardData(props).then((board) => {
      let boardValue = board;
      if (!boardValue) {
        boardValue = "invalid";
      }

      setBoardData(boardValue);
    });
  });

  const logout = () => {
    firebase.auth().signOut();
  };

  const loading = <Loader isFullScreen />;

  if (!boardData) {
    return loading;
  }

  if (loadingUser) {
    return loading;
  }

  // See https://github.com/firebase/firebaseui-web/#configuration
  const uiConfig = {
    ...defaultUiConfig,
    callbacks: {
      ...defaultUiConfig.callbacks,
      uiShown: () => {
        const container = document.getElementsByClassName(
          "login-button-container"
        )[0];
        // Options for the observer (which mutations to observe)
        const config = { childList: true, subtree: true };

        // Callback function to execute when mutations are observed
        const callback = () => {
          const emailInput = container.querySelector("#ui-sign-in-email-input");

          if (emailInput) {
            emailInput.value = boardData.email;
            emailInput.readOnly = true;
          }
        };

        // Create an observer instance linked to the callback function
        const observer = new MutationObserver(callback);

        // Start observing the target node for configured mutations
        observer.observe(container, config);
      },
    },
  };

  let content = null;
  const senderName = (
    <a href={`mailto:${boardData.sender_email}`}>{boardData.sender_name}</a>
  );

  if (boardData === "invalid") {
    content = (
      <Alert color="error" severity="error">
        This invitation is no longer valid.
      </Alert>
    );
  } else if (currentUser && !currentUser.isAnonymous) {
    if (boardData.email === currentUser.email) {
      const boardUrl = `/board/${boardData.board_id}`;

      content = (
        <Link to={boardUrl} className="confirm-button">
          Go to Board
        </Link>
      );
    } else {
      content = (
        <Alert color="error" severity="error">
          <p>
            You are currently logged in as {currentUser.email}. This invitation
            was not sent to this email address, it was sent to {boardData.email}
            . If you wish to access the whatboard &quot;
            {boardData.board_name}&quot;, please have {senderName} send an
            invitation to {currentUser.email}.
          </p>
          <p>
            If you own the account belonging to {boardData.email}, you may sign
            out of your current account using the button below. You can then
            sign in as {boardData.email}.
          </p>
          <p>
            <button className="confirm-button" type="button" onClick={logout}>
              Sign Out of {currentUser.email}
            </button>
          </p>
        </Alert>
      );
    }
  } else {
    content = (
      <FirebaseAuth uiConfig={uiConfig} firebaseAuth={firebase.auth()} />
    );
  }

  return (
    <>
      <SimpleNavBar />
      <div className="container-fluid">
        <div style={{ textAlign: "left" }}>
          <br />
          <br />
          <br />
          <div className="center margin-middle">
            <img width="140" height="140" src="/logo.png" alt="logo" />
            <br />
            <br />

            <h1>Realtime collaboration and sharing all in one dashboard.</h1>
            <br />
            <p>
              Welcome, {senderName} has invited you to view their whatboard:{" "}
              {boardData.board_name}. Please create a Whatboard account (or sign
              in using your existing one) to view this board.{" "}
              <strong>
                Please sign-in using the email matching your invitation from{" "}
                {senderName}.
              </strong>
            </p>
            <div className="login-button-container center accept-invite-container">
              {content}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
