import React from "react";
import ButtonLink from "../ButtonLink";
import SimpleNavBar from "../SimpleNavBar";

import "./ErrorPage.scss";

const ErrorPage = ({ children }) => {
  const content = children || (
    <>
      <h1 className="error-sub">You look lost...</h1>
      <h1 className="error-sub">Let&apos;s head back home.</h1>
      <br />
      <br />
      <ButtonLink className="confirm-button" route="/">
        Home
      </ButtonLink>
    </>
  );

  return (
    <>
      <SimpleNavBar />
      <div className="error-page container">
        <div className="error-content">
          <h1 className="error-header">what?</h1>
          {content}
        </div>
      </div>
    </>
  );
};

export default ErrorPage;
