import React, { useState, useEffect, useRef } from "react";
import CircularProgress from "@material-ui/core/CircularProgress";
import "./IFrameWrapper.scss";
import PropTypes from "prop-types";
import { getFirebaseFunctionsUrl } from "../utils";
import useUser from "../auth/useUser";

const targetOrigin = new URL(getFirebaseFunctionsUrl()).origin;

const ScriptEmbedViewer = (props) => {
  const { boardId, blockId, cacheBuster, title } = props;

  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const [isScriptEmbedLoading, setIsScriptEmbedLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState();
  const iframeRef = useRef();
  const { user } = useUser();

  useEffect(() => {
    try {
      if (isIframeLoading) {
        return;
      }

      const params = {
        boardId,
        blockId,
        accessToken: user.token.token,
      };

      iframeRef.current.contentWindow.postMessage(params, targetOrigin);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
      setErrorMessage(e.message);
      setIsIframeLoading(false);
      setIsScriptEmbedLoading(false);
    }
  }, [boardId, blockId, cacheBuster, user, isIframeLoading]);

  useEffect(() => {
    const recieveMessage = (event) => {
      if (event.origin !== targetOrigin) {
        return;
      }

      if (event.data.loaded) {
        setIsScriptEmbedLoading(false);
      }
    };

    window.addEventListener("message", recieveMessage, false);

    return () => {
      window.removeEventListener("message", recieveMessage);
    };
  }, []);

  const handleIframeLoad = () => {
    setIsIframeLoading(false);
  };

  const handleIframeError = () => {
    setIsIframeLoading(false);
    setIsScriptEmbedLoading(false);
  };

  const renderIframe = () => {
    let content = null;

    if (errorMessage) {
      content = <div className="iframe-error-message">{errorMessage}</div>;
    } else {
      const scriptEmbedSrc = `${getFirebaseFunctionsUrl()}/blocks-embedScriptsViewer`;
      content = (
        <iframe
          src={scriptEmbedSrc}
          className="frame-content"
          ref={iframeRef}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          title={title}
        />
      );
    }

    return content;
  };

  const renderLoader = () => {
    let content = null;

    if (isIframeLoading || isScriptEmbedLoading) {
      content = (
        <div className="iframe-wrapper-loader">
          <CircularProgress />
        </div>
      );
    }

    return content;
  };

  const content = renderIframe();

  return (
    <div className="iframe-wrapper">
      {content}
      {renderLoader()}
    </div>
  );
};

ScriptEmbedViewer.defaultProps = {
  cacheBuster: "",
  title: "",
};

ScriptEmbedViewer.propTypes = {
  boardId: PropTypes.string.isRequired,
  blockId: PropTypes.string.isRequired,
  cacheBuster: PropTypes.string,
  title: PropTypes.string,
};

export default ScriptEmbedViewer;
