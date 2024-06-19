import React from "react";
import PropTypes from "prop-types";
import Alert from "@material-ui/lab/Alert";
import AlertTitle from "@material-ui/lab/AlertTitle";
import _capitalize from "lodash/capitalize";
import oidcBaseUrl from "./oidcBaseUrl";

const underscoreToCaps = (text) => {
  const caps = text.split("_").map(_capitalize).join(" ");

  return caps;
};

const sentences = (lines) => {
  let output = lines.filter(Boolean).join(". ");

  if (!output.endsWith(".")) {
    output = `${output}.`;
  }

  return output;
};

const OidcError = React.forwardRef((props, ref) => {
  const { error, interaction, client } = props;

  let errorCode = "server_error";
  let errorDescription = error.toString();
  let returnToLink = null;

  if (error?.response?.data?.error) {
    errorCode = error?.response?.data?.error;
    errorDescription = error?.response?.data?.error_description;
  }

  const title = <>Error: {underscoreToCaps(errorCode)}</>;
  const message = sentences([errorDescription]);

  if (interaction && client) {
    const returnToUrl = new URL(
      `${oidcBaseUrl}/interaction/${interaction.uid}/abort`,
      window.location.origin
    );
    returnToUrl.searchParams.set("error", errorCode);
    returnToUrl.searchParams.set("error_description", errorDescription);

    returnToLink = (
      <a className="confirm-button" href={returnToUrl.toString()}>
        Return to {client.clientName}
      </a>
    );
  }

  return (
    <div className="oidc-error" ref={ref}>
      <Alert severity="error">
        <AlertTitle align="left">{title}</AlertTitle>
        {message}
      </Alert>
      {returnToLink}
    </div>
  );
});

OidcError.defaultProps = {
  interaction: null,
  client: null,
};

OidcError.propTypes = {
  error: PropTypes.instanceOf(Error).isRequired,
  interaction: PropTypes.shape({}),
  client: PropTypes.shape({}),
};

export default OidcError;
