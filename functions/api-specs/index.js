const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const apiSpecsV1 = require("./v1");

const app = express();

app.set("trust proxy", true);

app.use(cors());

app.use("/api-specs/v1", apiSpecsV1);

module.exports = functions.https.onRequest(async (req, res) => {
  app(req, res);
});
