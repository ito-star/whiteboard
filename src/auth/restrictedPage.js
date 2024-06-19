import React from "react";
import hoistNonReactStatics from "hoist-non-react-statics";
import { getDisplayName } from "@material-ui/utils";

import AuthCheck from "./AuthCheck";
import VerifyEmailPage from "../VerifyEmailPage";
import LoginPage from "../LoginPage";
import HomePage from "../pages/Home";
import TosCheck from "../TosCheck";
import Loader from "../components/Loader";

const restrictedPage = (options = {}) => (Component) => {
  const RestrictedPage = React.forwardRef((props, ref) => {
    const { allowAnonymous } = options;

    const fallback = props.match.url === "/" ? <HomePage /> : <LoginPage />;

    const loading = <Loader isFullScreen />;
    let emailFallback;
    let { requireVerifiedEmail = true, requireAcceptTos = true } = options;

    if (allowAnonymous) {
      requireVerifiedEmail = false;
      requireAcceptTos = false;
    }

    if (requireVerifiedEmail) {
      emailFallback = <VerifyEmailPage />;
    }

    return (
      <AuthCheck
        requireVerifiedEmail={requireVerifiedEmail}
        emailFallback={emailFallback}
        fallback={fallback}
        loading={loading}
        allowAnonymous={allowAnonymous}
      >
        {requireAcceptTos && (
          <TosCheck loading={loading}>
            <Component ref={ref} {...props} />
          </TosCheck>
        )}
        {!requireAcceptTos && <Component ref={ref} {...props} />}
      </AuthCheck>
    );
  });

  if (process.env.NODE_ENV !== "production") {
    RestrictedPage.displayName = `RestrictedPage(${getDisplayName(Component)})`;
  }

  hoistNonReactStatics(RestrictedPage, Component);

  return RestrictedPage;
};

export default restrictedPage;
