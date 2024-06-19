const basePath = require("./base-path");
const { getWhatboardUrl } = require("../utils");

const issuer = `${getWhatboardUrl()}${basePath}`;

module.exports = issuer;
