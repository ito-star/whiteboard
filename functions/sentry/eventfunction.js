/**
 * Port of Sentry.GCPFunction.wrapEventFunction that plays nicely with Firebase Functions
 */
const {
  captureException,
  flush,
  getCurrentHub,
  Handlers,
  startTransaction,
} = require("@sentry/serverless");
const { IS_DEBUG_BUILD } = require("@sentry/serverless/dist/flags");
const { extractTraceparentData } = require("@sentry/tracing");
const { isString, logger } = require("@sentry/utils");

const {
  domainify,
  getActiveDomain,
  proxyFunction,
} = require("@sentry/serverless/dist/utils");
const {
  configureScopeWithContext,
} = require("@sentry/serverless/dist/gcpfunction/general");
const functions = require("firebase-functions");

const { parseRequest } = Handlers;

/* eslint-disable no-underscore-dangle */
function _wrapEventFunction(fn, wrapOptions = {}) {
  const options = {
    flushTimeout: 2000,
    functionName: "",
    parseRequestOptions: {},
    ...wrapOptions,
  };

  return async (...args) => {
    let transaction;
    let context;

    if (args.length === 1) {
      [context] = args;
    } else {
      [, context] = args;
    }

    const req = context.rawRequest;

    if (req) {
      // Applying `sentry-trace` to context
      let traceparentData;
      if (req.headers && isString(req.headers["sentry-trace"])) {
        traceparentData = extractTraceparentData(req.headers["sentry-trace"]);
      }
      transaction = startTransaction({
        name: options.functionName,
        op: "gcp.function.https-oncall",
        ...traceparentData,
      });
    } else {
      transaction = startTransaction({
        name: context.eventType,
        op: "gcp.function.event",
      });
    }

    // getCurrentHub() is expected to use current active domain as a carrier
    // since functions-framework creates a domain for each incoming request.
    // So adding of event processors every time should not lead to memory bloat.
    getCurrentHub().configureScope((scope) => {
      if (req) {
        scope.addEventProcessor((event) => {
          const newEvent = parseRequest(event, req, {
            ...options.parseRequestOptions,
            transaction: false,
          });

          newEvent.transaction = options.functionName;

          return newEvent;
        });
        const scopeContext = {
          ...context,
        };
        delete scopeContext.rawRequest;
        configureScopeWithContext(scope, scopeContext);
      } else {
        configureScopeWithContext(scope, context);
      }
      // We put the transaction on the scope so users can attach children to it
      scope.setSpan(transaction);
    });

    const activeDomain = getActiveDomain();

    activeDomain.on("error", captureException);

    try {
      const ret = await fn(...args);
      transaction.setStatus("ok");
      return ret;
    } catch (e) {
      if (e instanceof functions.https.HttpsError) {
        transaction.setHttpStatus(e.httpErrorCode.status);
      } else {
        transaction.setStatus("unknown_error");
      }

      captureException(e);

      throw e;
    } finally {
      transaction.finish();

      try {
        await flush(options.flushTimeout);
      } catch (e) {
        if (IS_DEBUG_BUILD) {
          logger.error(e);
        }
      }
    }
  };
}

/**
 * Wraps an event function handler adding it error capture and tracing capabilities.
 *
 * @param fn Event handler
 * @param options Options
 * @returns Event handler
 */
module.exports = function wrapEventFunction(fn, wrapOptions = {}) {
  return proxyFunction(fn, (f) =>
    domainify(_wrapEventFunction(f, wrapOptions))
  );
};
