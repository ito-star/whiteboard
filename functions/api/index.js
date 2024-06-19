const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const _ = require("lodash");
const authenticate = require("./authenticate");
const { handleError } = require("./error-handler");
const { createUUID } = require("../utils");
const apiv1 = require("./v1");

const app = express();

app.set("trust proxy", true);

app.use(cors());

app.use(async (req, res, next) => {
  try {
    const user = await authenticate(req);

    res.locals.user = user;
    res.locals.firebaseIdToken = user.token.firebaseStr;

    const appOptions = JSON.parse(process.env.FIREBASE_CONFIG);
    appOptions.databaseAuthVariableOverride = {
      uid: user.token.firebase.sub,
      token: user.token.firebase,
    };

    /**
     * @type {import("firebase-admin").app.App}
     */
    req.firebase = admin.initializeApp(appOptions, createUUID());

    next();
  } catch (e) {
    next(e);
  }
});

app.get(["/me", "/v1/me"], (req, res) => {
  const body = _.omit(res.locals.user, ["token.firebase", "token.firebaseStr"]);

  res.status(200).json(body);
});

app.use("/v1", apiv1);

app.use(async (req, res, next) => {
  try {
    req.firebase.delete();
    next();
  } catch (e) {
    next(e);
  }
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    next(error);
  }

  handleError(error, res);
});

module.exports = functions.https.onRequest(async (req, res) => {
  app(req, res);
});
