const omitBy = require("lodash/omitBy");
const issuerUrl = require("../oidc/issuer-url");

exports.makeWwwAuthenticate = (scheme, fields) => {
  const wwwAuth = Object.entries(omitBy(fields, (v) => v === undefined))
    .map(([key, val]) => `${key}="${val.replace(/"/g, '\\"')}"`)
    .join(", ");

  return `${scheme} ${wwwAuth}`;
};

exports.makeWwwAutenticateForError = (error) => {
  const { message } = error;
  let description = error.errorDescription;
  let descriptionKey = "errorDescription";

  if (error.error_description) {
    descriptionKey = "error_description";
    description = error.error_description;
  }

  let lcDescription;

  if (description && description.toLowerCase) {
    lcDescription = description.toLowerCase();
  }

  return exports.makeWwwAuthenticate("Bearer", {
    realm: issuerUrl,
    ...(lcDescription !== "no access token provided"
      ? {
          error: message,
          [descriptionKey]: description,
        }
      : undefined),
  });
};
