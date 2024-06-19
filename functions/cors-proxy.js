const functions = require("firebase-functions");
const corsAnywhere = require("cors-anywhere");
const { getWhatboardUrl, isDev } = require("./utils");
const { wrapHttpFunction } = require("./sentry");

const corsProxy = corsAnywhere.createServer({
  originWhitelist: [getWhatboardUrl()],
  requireHeader: ["origin"],
  removeHeaders: [
    "cookie",
    "cookie2",
    // Strip Heroku-specific headers
    "x-request-start",
    "x-request-id",
    "via",
    "connect-time",
    "total-route-time",
    // Other Heroku added debug headers
    "x-forwarded-for",
    "x-forwarded-proto",
    "x-forwarded-port",
  ],
  redirectSameOrigin: false,
  httpProxyOptions: {
    // Do not add X-Forwarded-For, etc. headers, because Heroku already adds it.
    xfwd: false,
  },
});

module.exports = functions
  .runWith({ minInstances: isDev() ? 0 : 5 })
  .https.onRequest(
    wrapHttpFunction((req, res) => {
      const baseUrl = `${req.protocol}://${req.headers.host}`;
      const urlObj = new URL(req.url, baseUrl);
      const urlToProxy = urlObj.searchParams.get("url");

      req.url = `/${urlToProxy}`;
      corsProxy.emit("request", req, res);
    })
  );
