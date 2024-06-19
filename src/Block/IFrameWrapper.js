import React from "react";
import CircularProgress from "@material-ui/core/CircularProgress";
import "./IFrameWrapper.scss";
import PropTypes from "prop-types";
import axios from "axios";
import { sanitize } from "dompurify";
import HtmlReactParser, { attributesToProps } from "html-react-parser";
import clsx from "clsx";
import { IframelyBaseURL } from "../constant";
import ButtonLink from "../ButtonLink";
import access from "../access";
import UserContext from "../auth/UserContext";

class IFrameWrapper extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      errorMessage: "",
      isIframelyChecking: props.useIframely,
      insecureHttp: false,
      iFramelyhtml: "",
    };
    this.iframe = React.createRef();
  }

  componentDidMount() {
    this.checkIframelyAvailable();
  }

  componentDidUpdate(prevProps) {
    const { frameSrc, useIframely } = this.props;
    if (
      prevProps.frameSrc !== frameSrc ||
      prevProps.useIframely !== useIframely
    ) {
      this.checkIframelyAvailable();
    }
  }

  canEditBlock() {
    const { block } = this.props;
    const { user } = this.context;

    return access.canEditBlock(block, user);
  }

  handleIframeLoad = () => {
    this.setState({
      isLoading: false,
    });
  };

  checkIframelyAvailable = async () => {
    const { useIframely, frameSrc } = this.props;
    const isHttpUrl = frameSrc.startsWith("http://");

    this.setState({ isLoading: true });
    if (useIframely) {
      this.setState({
        isIframelyChecking: true,
        errorMessage: "",
        iFramelyhtml: "",
      });
      await axios
        .get(IframelyBaseURL, {
          params: {
            url: frameSrc,
            // eslint-disable-next-line camelcase
            key: process.env.REACT_APP_IFRAMELY_API_KEY,
            iframe: 1,
            // eslint-disable-next-line camelcase
            omit_script: 1,
            // eslint-disable-next-line camelcase
            omit_css: 1,
          },
        })
        .then((res) => {
          if (res.data && res.data.error) {
            const is417 = res.data.status === 417;

            this.setState({
              isLoading: false,
              isIframelyChecking: false,
              // Error code 417 means that Iframely can't generate embed codes for the given URL.
              // Since we have our own fallback for this situation, we just ignore the error message
              errorMessage: is417 ? "" : res.data.error,
              insecureHttp: is417 && isHttpUrl,
            });
          } else {
            this.setState({
              isIframelyChecking: false,
              iFramelyhtml: res.data.html,
            });
          }
        })
        .catch(() => {
          this.setState({
            isLoading: false,
            isIframelyChecking: false,
            errorMessage: "Sorry, unable to load the link.",
          });
        });
    } else {
      this.setState({
        insecureHttp: isHttpUrl,
        isLoading: !isHttpUrl,
      });
    }
  };

  renderIframe = () => {
    let { errorMessage } = this.state;
    const { insecureHttp } = this.state;
    const { title, frameSrc } = this.props;

    let content = null;

    if (!errorMessage && insecureHttp) {
      errorMessage = (
        <>
          <p className="mb-3 text-truncate mw-100">
            <a href={frameSrc} target="_blank" rel="noopener noreferrer">
              {frameSrc}
            </a>
          </p>
          <p className="mb-3">
            <ButtonLink
              className="confirm-button"
              route={frameSrc}
              target="_blank"
              rel="noopener noreferrer"
            >
              View Web Page
            </ButtonLink>
          </p>
          <p className="mb-3">
            This content cannot be previewed in the block. Please view this
            content using the link or button above.
          </p>
          {this.canEditBlock() && (
            <p className="mb-3">
              [ Block owner: you may want to use a Button block, or iFramely for
              a possibly improved preview. ]
            </p>
          )}
        </>
      );
    }

    if (errorMessage) {
      content = <div className="iframe-error-message">{errorMessage}</div>;
    } else {
      content = (
        <iframe
          src={frameSrc}
          className="frame-content"
          ref={this.iframe}
          onLoad={this.handleIframeLoad}
          onError={this.handleIframeLoad}
          title={title}
        />
      );
    }

    return content;
  };

  renderIframely = () => {
    const { title: titleProp } = this.props;
    const { isIframelyChecking, iFramelyhtml } = this.state;

    let content = null;

    if (isIframelyChecking) {
      return content;
    }

    if (iFramelyhtml) {
      const self = this;
      const cleanHtml = sanitize(iFramelyhtml, {
        ADD_TAGS: ["iframe"],
        ADD_ATTR: ["allow", "allowfullscreen", "scrolling"],
      });

      const options = {
        /**
         * @param {import("html-react-parser").Element} domNode
         */
        replace(domNode) {
          if (domNode.type === "tag" && domNode.name === "iframe") {
            return (
              <iframe
                {...attributesToProps(domNode.attribs)}
                ref={self.iframe}
                className={clsx(domNode.attribs.class, "frame-content")}
                onLoad={self.handleIframeLoad}
                onError={self.handleIframeLoad}
                title={domNode.attribs.title || titleProp}
              />
            );
          }

          return undefined;
        },
      };

      content = HtmlReactParser(cleanHtml, options);
    } else {
      content = this.renderIframe();
    }

    return content;
  };

  renderLoader = () => {
    const { isLoading } = this.state;

    let content = null;

    if (isLoading) {
      content = (
        <div className="iframe-wrapper-loader">
          <CircularProgress />
        </div>
      );
    }

    return content;
  };

  render() {
    const { useIframely } = this.props;

    let content = null;

    if (useIframely) {
      content = this.renderIframely();
    } else {
      content = this.renderIframe();
    }

    return (
      <div className="iframe-wrapper no-script-embed">
        {content}
        {this.renderLoader()}
      </div>
    );
  }
}

IFrameWrapper.contextType = UserContext;

IFrameWrapper.defaultProps = {
  frameSrc: "",
  title: "",
  useIframely: false,
};

IFrameWrapper.propTypes = {
  frameSrc: PropTypes.string,
  title: PropTypes.string,
  useIframely: PropTypes.bool,
  block: PropTypes.shape({}).isRequired,
};

export default IFrameWrapper;
