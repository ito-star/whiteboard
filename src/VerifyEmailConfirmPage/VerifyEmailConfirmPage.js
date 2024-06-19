import React, { useState, useEffect } from "react";
import { compose } from "redux";
import Alert from "react-bootstrap/Alert";
import { Redirect, useLocation } from "react-router-dom";

import { initFirebase, useDestination, getCallableFbFunction } from "../utils";
import SimpleNavBar from "../SimpleNavBar";
import restrictedPage from "../auth/restrictedPage";
import Loader from "../components/Loader";

initFirebase();

const VerifyEmailConfirmPage = () => {
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState();
  const location = useLocation();
  let destination = useDestination();

  if (destination.pathname === location.pathname) {
    destination = {
      pathname: "/",
    };
  }

  useEffect(() => {
    const confirmEmailVerified = async () => {
      const func = getCallableFbFunction("users-confirmEmailVerified");

      try {
        await func();
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    confirmEmailVerified();
  }, []);

  let content;

  if (isLoading) {
    content = <Loader isFullScreen />;
  } else if (error) {
    content = <Alert>{error}</Alert>;
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

const enhance = compose(restrictedPage());

export default enhance(VerifyEmailConfirmPage);
