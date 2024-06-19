import React from "react";
import { Link } from "react-router-dom";
import ErrorPage from "../ErrorPage";
import ButtonLink from "../ButtonLink";

const NotFoundPage = () => {
  return (
    <ErrorPage>
      <h1 className="error-sub">
        The board address specified cannot be found.
      </h1>
      <h1 className="error-sub">
        It may have been deleted, made private, or the public address may have
        changed.
      </h1>
      <h1 className="error-sub">
        Learn more at <Link to="/">whatboard.app</Link>.
      </h1>
      <br />
      <br />
      <ButtonLink route="/" className="confirm-button">
        Return to Whatboard
      </ButtonLink>
    </ErrorPage>
  );
};

export default NotFoundPage;
