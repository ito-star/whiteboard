const createError = require("http-errors");
const { makeWwwAutenticateForError } = require("./make-www-authenticate");

/**
 *
 * @param {Error|import("http-errors").HttpError} e
 */
exports.prepareResponseHeadersAndBody = (e) => {
  let expose = false;
  const data = {};

  if (createError.isHttpError(e)) {
    expose = e.expose;
    data.status = e.status;
    data.headers = e.headers;
  } else {
    data.status = 500;
  }

  let body = {
    error: "server_error",
    errorDescription: "oops! something went wrong",
  };

  if (expose) {
    body = {
      error: e.message,
      errorDescription: e.errorDescription || e.error_description,
    };

    const wwwAuthenticate = makeWwwAutenticateForError(e);

    if (data.headers) {
      const lcHeaders = Object.keys(data.headers).map((header) =>
        header.toLowerCase()
      );

      if (!lcHeaders.includes("www-authenticate")) {
        data.headers["WWW-Authenticate"] = wwwAuthenticate;
      }
    } else {
      data.headers = {
        "WWW-Authenticate": wwwAuthenticate,
      };
    }
  }

  data.body = body;

  return data;
};

/**
 *
 * @param {Error} e
 */
exports.logError = (e) => {
  console.error(e);
};

exports.writeHeaders = (data, res) => {
  res.status(data.status);

  if (data.headers) {
    for (const [header, value] of Object.entries(data.headers)) {
      res.set(header, value);
    }
  }
};

/**
 *
 * @param {Error|import("http-errors").HttpError} e
 * @param {import("express").Response} res
 */
exports.handleError = (e, res) => {
  exports.logError(e);

  const data = exports.prepareResponseHeadersAndBody(e);

  exports.writeHeaders(data, res);

  res.json(data.body);
};
