import React, { useState } from "react";
import PropTypes from "prop-types";
import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import CircleIcon from "mdi-material-ui/Circle";
import axios from "axios";

import useUser from "../auth/useUser";
import oidcBaseUrl from "./oidcBaseUrl";
import OidcError from "./OidcError";

const Consent = (props) => {
  const { interaction, client } = props;

  const [working, setWorking] = useState(false);
  const [error, setError] = useState();
  const { user } = useUser();

  const confirmConsent = async () => {
    try {
      setWorking(true);

      const response = await axios.post(
        `${oidcBaseUrl}/interaction/${interaction.uid}/confirm`,
        {},
        {
          headers: {
            Authorization: `Bearer ${user.token.token}`,
          },
        }
      );

      window.location = response.data.returnTo;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
      setError(e);
    } finally {
      setWorking(false);
    }
  };

  let clientName;

  if (client.clientUri) {
    clientName = <a href={client.clientUri}>{client.clientName}</a>;
  } else {
    clientName = client.clientName;
  }

  let clientTos = "terms of service";

  if (client.tosUri) {
    clientTos = <a href={client.tosUri}>{clientTos}</a>;
  }

  let clientPrivacy = "privacy policy";

  if (client.policyUri) {
    clientPrivacy = <a href={client.policyUri}>{clientPrivacy}</a>;
  }

  const icon = <CircleIcon />;

  const scopeDescs = {
    email: "Access your email address",
    phone: "Access your phone number",
    profile: "Access information from your user profile (name, avatar, etc.)",
  };

  const {
    prompt: {
      details: { scopes },
    },
  } = interaction;

  const allScopes = Array.from(new Set(scopes.new, scopes.accepted));

  return (
    <>
      {error && <OidcError error={error} />}
      <h1>
        {clientName}
        <br /> wants to access your Whatboard account
      </h1>

      <p>{user.email}</p>

      <Box textAlign="left">
        <h4>This will allow {clientName} to:</h4>

        <List>
          <ListItem>
            <ListItemIcon>{icon}</ListItemIcon>
            <ListItemText primary="Read information about Boards that you have created, including their contents" />
          </ListItem>
          <ListItem>
            <ListItemIcon>{icon}</ListItemIcon>
            <ListItemText primary="Modify and/or delete Boards that you have created, including their contents, on your behalf" />
          </ListItem>
          {allScopes.map((scope) => {
            if (scopeDescs[scope]) {
              return (
                <ListItem key={scope}>
                  <ListItemIcon>{icon}</ListItemIcon>
                  <ListItemText primary={scopeDescs[scope]} />
                </ListItem>
              );
            }

            return null;
          })}
        </List>

        <h4>Make sure that you trust {clientName}</h4>

        <p>
          You may be sharing sensitive info with this site or app. Find out how{" "}
          {clientName} will handle your data by reviewing its {clientTos} and{" "}
          {clientPrivacy}.
        </p>

        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mx="10%"
        >
          <a href={`${oidcBaseUrl}/interaction/${interaction.uid}/abort`}>
            Cancel
          </a>
          <Button
            disabled={working}
            type="button"
            className="confirm-button"
            onClick={confirmConsent}
          >
            Allow
          </Button>
        </Box>
      </Box>
    </>
  );
};

Consent.propTypes = {
  interaction: PropTypes.shape({}).isRequired,
  client: PropTypes.shape({}).isRequired,
};

export default Consent;
