const pollingEndpoints = require("./polling-endpoints");
const dbHooks = require("./db-hooks");
const fields = require("./fields");

module.exports = {
  ...dbHooks,
  ...pollingEndpoints,
  ...fields,
};
