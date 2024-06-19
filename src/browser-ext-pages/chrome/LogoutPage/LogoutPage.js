import React, { useState, useEffect } from "react";
import { compose } from "redux";
import Alert from "@material-ui/lab/Alert";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";

import restrictedPage from "../../../auth/restrictedPage";
import SimpleNavBar from "../../../SimpleNavBar";
import { useQueryParams } from "../../../utils";
import Loader from "../../../components/Loader";

const EXTENSION_ID_PARAM = "extensionId";
const VALID_EXTENSION_IDS = [
  "npaccllkphikfkdbmedailkemffjffgg",
  "jaehimpcikljgmipgcklljgccoafekof",
];

const LogoutPage = () => {
  const [error, setError] = useState();
  const [isLoading, setLoading] = useState(true);
  const [returnTo, setReturnTo] = useState();
  const queryParams = useQueryParams();

  useEffect(() => {
    const runner = async () => {
      try {
        const extensionId = queryParams.get(EXTENSION_ID_PARAM);

        if (!extensionId) {
          throw new Error("Missing extension ID.");
        }

        if (!VALID_EXTENSION_IDS.includes(extensionId)) {
          throw new Error("Unknown extension ID.");
        }

        const url = new URL(
          `https://${extensionId}.chromiumapp.org/sign-out-callback`
        );
        url.search = queryParams.toString();
        url.searchParams.delete(EXTENSION_ID_PARAM);

        setReturnTo(url.toString());
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(e);
        setError(e);
        setReturnTo(null);
      } finally {
        setLoading(false);
      }
    };
    runner();
  }, [queryParams]);

  useEffect(() => {
    if (!isLoading && !error && returnTo) {
      const go = () => {
        window.location.href = returnTo;
      };
      firebase.auth().signOut().then(go, go);
    }
  }, [isLoading, error, returnTo]);

  let content;
  const loading = <Loader isFullScreen />;

  if (isLoading) {
    content = loading;
  } else if (error) {
    content = (
      <Alert color="error" severity="error">
        {error.toString()}
      </Alert>
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
          <div className="center margin-middle">{content}</div>
        </div>
      </div>
    </>
  );
};

const enhance = compose(restrictedPage());

export default enhance(LogoutPage);
