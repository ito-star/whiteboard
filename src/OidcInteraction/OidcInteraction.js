import React, { useState, useEffect } from "react";
import { compose } from "redux";
import { useParams } from "react-router-dom";
import axios from "axios";
import clsx from "clsx";
import "./OidcInteraction.scss";

import useUser from "../auth/useUser";
import restrictedPage from "../auth/restrictedPage";
import SimpleNavBar from "../SimpleNavBar";
import Loader from "../components/Loader";

import Login from "./Login";
import Consent from "./Consent";
import oidcBaseUrl from "./oidcBaseUrl";
import OidcError from "./OidcError";

const OidcInteraction = () => {
  const { id: interactionId } = useParams();
  const { user } = useUser();
  const [interaction, setInteraction] = useState();
  const [client, setClient] = useState();
  const [error, setError] = useState();
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const runner = async () => {
      try {
        const response = await axios.get(
          `${oidcBaseUrl}/interaction/${interactionId}/info`,
          {
            headers: {
              Authorization: `Bearer ${user.token.token}`,
            },
          }
        );

        setInteraction(response.data.interaction);
        setClient(response.data.client);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(e);
        setError(e);
      } finally {
        setLoading(false);
      }
    };
    runner();
  }, [user.token.token, interactionId]);

  let content;
  const loading = <Loader isFullScreen />;
  const contentClasses = {
    center: true,
    "margin-middle": true,
    "oidc-interaction-loading": isLoading,
    "oidc-interaction-error": Boolean(error),
  };

  if (isLoading) {
    content = loading;
  } else if (error) {
    content = <OidcError error={error} />;
  } else {
    const {
      prompt: { name },
    } = interaction;

    const interactionProps = {
      interaction,
      client,
      loading,
    };

    let isValidInteractionName = true;

    switch (name) {
      case "login":
        content = <Login {...interactionProps} />;
        break;
      case "consent":
        content = <Consent {...interactionProps} />;
        break;
      default:
        {
          isValidInteractionName = false;
          contentClasses["oidc-interaction-error"] = true;
          const interactionTypeError = new Error(
            `Unknown interaction type ${name}`
          );
          content = (
            <OidcError
              error={interactionTypeError}
              interaction={interaction}
              client={client}
            />
          );
        }
        break;
    }

    contentClasses[`oidc-interaction-type-${name}`] = isValidInteractionName;
  }

  return (
    <>
      <SimpleNavBar />
      <div className="container-fluid">
        <div style={{ textAlign: "left" }}>
          <br />
          <br />
          <br />
          <div className={clsx(contentClasses)}>{content}</div>
        </div>
      </div>
    </>
  );
};

const enhance = compose(restrictedPage());

export default enhance(OidcInteraction);
