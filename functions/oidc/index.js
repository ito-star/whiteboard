const functions = require("firebase-functions");
const provider = require("./provider");
const webApp = require("./app");
const basePath = require("./base-path");
const issuerUrl = require("./issuer-url");

let oidc;
let app;

// eslint-disable-next-line no-unused-vars
const init = async (req, res) => {
  if (!oidc) {
    oidc = await provider(issuerUrl, basePath);
  }

  if (!app) {
    app = await webApp(oidc, basePath);
  }
};

module.exports = functions.https.onRequest(async (req, res) => {
  await init(req, res);

  app(req, res);
});
