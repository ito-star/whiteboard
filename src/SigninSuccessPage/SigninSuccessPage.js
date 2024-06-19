import React, { useState, useEffect } from "react";
import { compose } from "redux";
import Alert from "react-bootstrap/Alert";
import { Redirect, useLocation } from "react-router-dom";
import { useLocalStorage } from "react-use";

import { initFirebase, useDestination } from "../utils";
import SimpleNavBar from "../SimpleNavBar";
import restrictedPage from "../auth/restrictedPage";
import useUser from "../auth/useUser";
import Loader from "../components/Loader";

initFirebase();

const SigninSuccessPage = () => {
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState();
  const location = useLocation();
  let destination = useDestination();
  const [authResult, , removeAuthResult] = useLocalStorage(
    "whatboard-auth-result"
  );
  const {
    user,
    loadingUser,
    updateUserProfile,
    sendEmailVerification,
  } = useUser();

  if (destination.pathname === location.pathname) {
    destination = {
      pathname: "/",
    };
  }

  useEffect(() => {
    const signInSuccess = async () => {
      try {
        const promises = [];

        if (!authResult) {
          return;
        }

        const { additionalUserInfo, operationType } = authResult;

        if (additionalUserInfo.isNewUser || operationType === "link") {
          if (!user.emailVerified) {
            promises.push(sendEmailVerification(destination));
          }

          const profileFromProvider = additionalUserInfo.profile || {};
          const profile = {
            displayName: user.displayName || profileFromProvider.name,
            photoURL: user.photoURL || profileFromProvider.picture,
          };

          promises.push(updateUserProfile(profile));
        }

        await Promise.all(promises);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    signInSuccess();

    return () => {
      removeAuthResult();
    };
  }, [
    authResult,
    removeAuthResult,
    user,
    destination,
    sendEmailVerification,
    updateUserProfile,
  ]);

  let content;

  if (isLoading || loadingUser) {
    content = <Loader isFullScreen />;
  } else if (error) {
    content = <Alert variant="danger">{error}</Alert>;
  } else {
    content = <Redirect to={destination} />;
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

const enhance = compose(
  restrictedPage({
    requireVerifiedEmail: false,
    requireAcceptTos: false,
  })
);

export default enhance(SigninSuccessPage);
