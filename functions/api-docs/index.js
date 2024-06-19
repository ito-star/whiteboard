const functions = require("firebase-functions");
const express = require("express");
const swaggerUi = require("swagger-ui-express");
const { getWhatboardUrl } = require("../utils");

const app = express();

app.set("trust proxy", true);

const swaggerUIOpts = {
  customSiteTitle: "Whatboard API Docs",
  customfavIcon: `${getWhatboardUrl()}/favicon.ico`,
  swaggerOptions: {
    urls: [
      {
        name: "Whatboard API v1",
        url: "/api-specs/v1/openapi.json",
      },
    ],
    oauth2RedirectUrl: `${getWhatboardUrl()}/api-docs/oauth2-redirect.html`,
    oauth: {
      clientId: "cUXAn8r-cjGwxz9eP16oXjjt7sEGm18S",
      usePkceWithAuthorizationCodeGrant: true,
      scopes: ["openid"],
    },
  },
};

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(null, swaggerUIOpts));

module.exports = functions.https.onRequest(async (req, res) => {
  app(req, res);
});
