// eslint-disable-next-line import/order -- // This file MUST be imported as early as possible!!!
import { history, Route } from "./sentry";
import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom";
import "bootstrap/dist/css/bootstrap.css";
import "focus-visible";
import "@stripe/stripe-js";

import "./index.scss";

import { SnackbarProvider } from "notistack";
import { ConfirmProvider } from "material-ui-confirm";
import { ThemeProvider } from "@material-ui/core/styles";
import ModalProvider from "mui-modal-provider";
import { Router, Switch } from "react-router-dom";
import { Provider } from "react-redux";
import { MDXProvider } from "@mdx-js/react";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
import reportWebVitals from "./reportWebVitals";
import MdxLink from "./MdxLink";
import GlobalStyle from "./GlobalStyle";
import UserProvider from "./auth/UserProvider";
import ScrollToElement from "./ScrollToElement";
import Loader from "./components/Loader";
import configureStore from "./store";
import theme from "./theme/mui-theme";

const Board = lazy(() => import("./Board"));
const BoardDailyDigest = lazy(() => import("./pages/BoardDailyDigest"));
const Block = lazy(() => import("./Block/Block"));
const MaintainanceMode = lazy(() => import("./MaintenanceMode"));
const ReadOnlyBoard = lazy(() => import("./ReadOnlyBoard"));
const ErrorPage = lazy(() => import("./ErrorPage"));
const TosPage = lazy(() => import("./TosPage"));
const AcceptInvite = lazy(() => import("./AcceptInvite"));
const VerifyEmailConfirmPage = lazy(() => import("./VerifyEmailConfirmPage"));
const ReportedBoard = lazy(() => import("./ReportedBoard"));
const OidcInteraction = lazy(() => import("./OidcInteraction"));
const LoginPage = lazy(() => import("./LoginPage"));
const PricesPage = lazy(() => import("./PricesPage"));
const AccountPage = lazy(() => import("./AccountPage"));
const SecurityPage = lazy(() => import("./SecurityPage"));
const FriendlyUrlPage = lazy(() => import("./FriendlyUrlPage"));
const SigninSuccessPage = lazy(() => import("./SigninSuccessPage"));
const ResetTokenVerification = lazy(() =>
  import("./ResetPasswordVerificationPage")
);
const ChromeExtLogoutPage = lazy(() =>
  import("./browser-ext-pages/chrome/LogoutPage")
);
const BillingPortalPage = lazy(() => import("./BillingPortalPage"));
const Dashboard = lazy(() => import("./Dashboard"));

const stringToBool = (s) => {
  const string = String(s);

  switch (string.toLowerCase()) {
    case 1:
    case "1":
    case "true":
    case "yes":
    case "on":
      return true;
    case 0:
    case "0":
    case "false":
    case "no":
    case "off":
    default:
      return false;
  }
};

// Redirect Firebase Hosting default domains to our
// custom ones.
//
// As much as I would love for this to be done server-side,
// that simply isn't possible with the way Firebase Hosting
// is set up.
const domainRedirects = {
  "armspaces.web.app": "whatboard.app",
  "armspaces.firebaseapp.com": "whatboard.app",
  "whatboard-dev.web.app": "dev.whatboard.app",
  "whatboard-dev.firebaseapp.com": "dev.whatboard.app",
};

if (domainRedirects[window.location.host]) {
  const urlObj = new URL(window.location.href);
  urlObj.hostname = domainRedirects[window.location.host];
  urlObj.port = "";
  urlObj.protocol = "https:";
  window.location.replace(urlObj.toString());
}

const store = configureStore();

let app;

if (window.location.pathname === "/" && window.location.hash.startsWith("#/")) {
  window.location = window.location.hash.substr(1);
}

const loading = <Loader isFullScreen />;

if (stringToBool(process.env.REACT_APP_MAINTENANCE_MODE)) {
  app = <MaintainanceMode />;
} else {
  const mdxComponents = {
    a: MdxLink,
  };

  app = (
    <React.StrictMode>
      <Suspense fallback={loading}>
        <ThemeProvider theme={theme}>
          <SnackbarProvider maxSnack={5}>
            <GlobalStyle />
            <Provider store={store}>
              <Router history={history}>
                <ScrollToElement />
                <UserProvider>
                  <ConfirmProvider
                    defaultOptions={{
                      cancellationText: "Cancel",
                      confirmationButtonProps: {
                        variant: "contained",
                        className: "cancel-button",
                      },
                      cancellationButtonProps: {
                        variant: "contained",
                        className: "neutral-button",
                      },
                    }}
                  >
                    <ModalProvider legacy>
                      <MDXProvider components={mdxComponents}>
                        <Switch>
                          <Route exact path="/" component={Dashboard} />
                          <Route exact path="/login">
                            <LoginPage newUser={false} />
                          </Route>
                          <Route exact path="/signup">
                            <LoginPage newUser />
                          </Route>
                          <Route
                            exact
                            path="/sign-in-success"
                            component={SigninSuccessPage}
                          />

                          <Route exact path="/pricing" component={PricesPage} />
                          <Route
                            exact
                            path="/security"
                            component={SecurityPage}
                          />
                          <Route
                            extact
                            path="/account/billing/billing-portal"
                            component={BillingPortalPage}
                          />
                          <Route path="/account" component={AccountPage} />
                          <Route
                            exact
                            path="/daily-digest"
                            component={BoardDailyDigest}
                          />
                          <Route
                            exact
                            path="/confirm-email-verified"
                            component={VerifyEmailConfirmPage}
                          />
                          <Route exact path="/board/:id" component={Board} />
                          <Route
                            exact
                            path="/board/:id/reset-token/:token"
                            component={ResetTokenVerification}
                          />
                          <Route
                            exact
                            path="/board/:board_id/block/:id"
                            component={(props) => (
                              <Block {...props} isFullBlock />
                            )}
                          />
                          <Route
                            path="/readonlyboard/:id"
                            component={ReadOnlyBoard}
                          />
                          <Route
                            path="/b/:id"
                            exact
                            component={FriendlyUrlPage}
                          />
                          <Route exact path="/terms">
                            <TosPage type="terms" />
                          </Route>
                          <Route exact path="/privacy">
                            <TosPage type="privacy" />
                          </Route>
                          <Route exact path="/acceptable-use">
                            <TosPage type="acceptable-use" />
                          </Route>
                          <Route
                            path="/reported-board"
                            component={ReportedBoard}
                          />
                          <Route
                            path="/accept-invite/:id"
                            component={AcceptInvite}
                          />
                          <Route
                            exact
                            path="/oidc/interaction/:id"
                            component={OidcInteraction}
                          />
                          <Route
                            exact
                            path="/browser-ext/chrome/logout"
                            component={ChromeExtLogoutPage}
                          />
                          <Route component={ErrorPage} />
                        </Switch>
                      </MDXProvider>
                    </ModalProvider>
                  </ConfirmProvider>
                </UserProvider>
              </Router>
            </Provider>
          </SnackbarProvider>
        </ThemeProvider>
      </Suspense>
    </React.StrictMode>
  );
}

ReactDOM.render(app, document.getElementById("root"));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.unregister();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
