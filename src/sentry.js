import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";
import { createBrowserHistory } from "history";
import { Route as ReactRouterRoute } from "react-router-dom";
import getFirebaseFunctionsUrl from "./firebase-functions-url";

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

export const history = createBrowserHistory();

export const Route = Sentry.withSentryRouting(ReactRouterRoute);

Sentry.init({
  enabled: stringToBool(process.env.REACT_APP_SENTRY_ENABLED),
  dsn:
    "https://952cf3c6fa4b4db399496db6e16dea63@o450530.ingest.sentry.io/5435064",
  environment: process.env.REACT_APP_SENTRY_ENVIRONMENT || process.env.NODE_ENV,
  release: process.env.REACT_APP_SENTRY_RELEASE,
  debug: stringToBool(process.env.REACT_APP_SENTRY_DEBUG),
  integrations: [
    new BrowserTracing({
      tracingOrigins: [
        new RegExp(`^${window.location.origin}/`, "i"),
        /^\//i,
        new RegExp(`^${getFirebaseFunctionsUrl()}/`, "i"),
      ],
      routingInstrumentation: Sentry.reactRouterV5Instrumentation(history),
    }),
  ],
  tracesSampleRate: 1.0,
  normalizeDepth: 10,
  ignoreErrors: [
    // Random plugins/extensions
    "top.GLOBALS",
    // See: http://blog.errorception.com/2012/03/tale-of-unfindable-js-error.html
    "originalCreateNotification",
    "canvas.contentDocument",
    "MyApp_RemoveAllHighlights",
    "http://tt.epicplay.com",
    "Can't find variable: ZiteReader",
    "jigsaw is not defined",
    "ComboSearch is not defined",
    "http://loading.retry.widdit.com/",
    "atomicFindClose",
    // Facebook borked
    "fb_xd_fragment",
    // ISP "optimizing" proxy - `Cache-Control: no-transform` seems to
    // reduce this. (thanks @acdha)
    // See http://stackoverflow.com/questions/4113268
    "bmi_SafeAddOnload",
    "EBCallBackMessageReceived",
    // See http://toolbar.conduit.com/Developer/HtmlAndGadget/Methods/JSInjection.aspx
    "conduitPage",
  ],
  denyUrls: [
    // Facebook flakiness
    /graph\.facebook\.com/i,
    // Facebook blocked
    /connect\.facebook\.net\/en_US\/all\.js/i,
    // Woopra flakiness
    /eatdifferent\.com\.woopra-ns\.com/i,
    /static\.woopra\.com\/js\/woopra\.js/i,
    // Chrome extensions
    /extensions\//i,
    /^chrome:\/\//i,
    // Other plugins
    /127\.0\.0\.1:4001\/isrunning/i, // Cacaoweb
    /webappstoolbarba\.texthelp\.com\//i,
    /metrics\.itunes\.apple\.com\.edgesuite\.net\//i,
  ],
});
