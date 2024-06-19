import React from "react";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import FirebaseAuth from "react-firebaseui/FirebaseAuth";
import { Redirect } from "react-router-dom";

import { initFirebase } from "../utils";
import useFirebaseUiConfig from "../auth/useFirebaseUiConfig";
import useUser from "../auth/useUser";
import SimpleNavBar from "../SimpleNavBar";

initFirebase();

export default function LoginPage(props) {
  const defaultUiConfig = useFirebaseUiConfig();
  const { user } = useUser();

  const { newUser } = props;

  const message = newUser ? "Sign Up" : "Log In";
  const signInOptions = defaultUiConfig.signInOptions.map((el) => {
    let buttonText = `Sign in with ${el.providerName}`;
    if (newUser) {
      buttonText = `Sign up with ${el.providerName}`;
    }
    return { ...el, fullLabel: buttonText };
  });

  const uiConfig = {
    ...defaultUiConfig,
    signInOptions,
  };

  let content;

  if (user && !user.isAnonymous) {
    content = <Redirect to="/" />;
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
            <h1 style={{ fontSize: "26px" }}>{message}</h1>
            <br />

            <div className="login-button-container center">{content}</div>
          </div>
        </div>
      </div>
    </>
  );
}
