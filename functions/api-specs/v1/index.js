const express = require("express");
const jsYaml = require("js-yaml");
const fs = require("fs");
const path = require("path");
const {
  isFunctionsEmulator,
  isDevProject,
  getWhatboardUrl,
} = require("../../utils");

const apiSpecPath = path.join(__dirname, "openapi.yml");
const apiSpec = jsYaml.load(fs.readFileSync(apiSpecPath, "utf8"));

const apiDocsV1 = express.Router();

apiDocsV1.use(async (req, res, next) => {
  try {
    let env = "production";

    if (isFunctionsEmulator()) {
      env = "local";
    } else if (isDevProject()) {
      env = "development";
    }

    const newApiSpec = {
      ...apiSpec,
    };

    newApiSpec.servers = newApiSpec.servers.filter((server) => {
      return server["x-whatboard-env"] === env;
    });

    const prevOIDCUrl =
      newApiSpec.components.securitySchemes.OIDC.openIdConnectUrl;

    newApiSpec.components.securitySchemes.OIDC.openIdConnectUrl = newApiSpec.components.securitySchemes.OIDC.openIdConnectUrl.replace(
      "https://whatboard.app",
      getWhatboardUrl()
    );

    newApiSpec.info.description = newApiSpec.info.description.replace(
      prevOIDCUrl,
      newApiSpec.components.securitySchemes.OIDC.openIdConnectUrl
    );

    res.locals.apiSpec = newApiSpec;
    next();
  } catch (e) {
    next(e);
  }
});

apiDocsV1.get("/openapi.json", async (req, res, next) => {
  try {
    res.json(res.locals.apiSpec);
  } catch (e) {
    next(e);
  }
});

module.exports = apiDocsV1;
