const Sentry = require("@sentry/serverless");

exports.wrapHttpFunction = Sentry.GCPFunction.wrapHttpFunction;
exports.wrapEventFunction = require("./eventfunction");
