import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import axios from "axios";

import useUser from "../auth/useUser";
import OidcError from "./OidcError";
import oidcBaseUrl from "./oidcBaseUrl";

const Login = (props) => {
  const { interaction, client, loading = null } = props;

  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState();
  const [returnTo, setReturnTo] = useState();
  const { user } = useUser();

  useEffect(() => {
    const runner = async () => {
      try {
        const response = await axios.post(
          `${oidcBaseUrl}/interaction/${interaction.uid}/login`,
          {},
          {
            headers: {
              Authorization: `Bearer ${user.token.token}`,
            },
          }
        );

        setReturnTo(response.data.returnTo);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        setError(e);
        setReturnTo(null);
      } finally {
        setLoading(false);
      }
    };
    runner();
  }, [interaction, user.token.token]);

  useEffect(() => {
    if (!isLoading && !error && returnTo) {
      window.location.href = returnTo;
    }
  }, [isLoading, error, returnTo]);

  let content = null;

  if (isLoading) {
    content = loading;
  } else if (error) {
    content = (
      <OidcError error={error} interaction={interaction} client={client} />
    );
  }

  return content;
};

Login.propTypes = {
  interaction: PropTypes.shape({}).isRequired,
  client: PropTypes.shape({}).isRequired,
  loading: PropTypes.node,
};

export default Login;
