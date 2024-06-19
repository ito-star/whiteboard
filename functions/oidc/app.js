/* eslint-disable camelcase */
const { strict: assert } = require("assert");
const express = require("express");
const admin = require("firebase-admin");
const session = require("express-session");
const FirestoreStore = require("firestore-store")(session);
const { Cookie, CookieJar, cookieCompare } = require("tough-cookie");
const { parse: parseCookies } = require("cookie");
const pMap = require("p-map");
const isEqual = require("react-fast-compare");
const Account = require("./account");
const { getCookieKeys } = require("./secrets");
const errorHandler = require("../api/error-handler");

const NO_CACHE_HEADERS = {
  Pragma: "no-cache",
  "Cache-Control": "private, no-cache, no-store, must-revalidate",
};

const SESSION_COOKIE_NAME = "__session";

function setNoCache(req, res, next) {
  for (const [key, value] of Object.entries(NO_CACHE_HEADERS)) {
    res.set(key, value);
  }
  next();
}

const firestore = admin.firestore();

/**
 * Helper function for creating a getter on an object.
 *
 * @param {Object} obj
 * @param {String} name
 * @param {Function} getter
 * @private
 */
function defineGetter(obj, name, getter) {
  Object.defineProperty(obj, name, {
    configurable: true,
    enumerable: true,
    get: getter,
  });
}

module.exports = async (oidc, basePath) => {
  const app = express();

  app.set("trust proxy", true);

  const { urlencoded } = express;
  const body = urlencoded({ extended: false });

  const cookieKeys = await getCookieKeys();

  app.use((req, res, next) => {
    defineGetter(req, "hostAndPort", function port() {
      const trust = this.app.get("trust proxy fn");
      let host = this.get("X-Forwarded-Host");

      if (!host || !trust(this.connection.remoteAddress, 0)) {
        host = this.get("Host");
      } else if (host.indexOf(",") !== -1) {
        // Note: X-Forwarded-Host is normally only ever a
        //       single value, but this is to be safe.
        host = host.substring(0, host.indexOf(",")).trimRight();
      }

      if (!host) {
        return undefined;
      }

      return host;
    });

    next();
  });

  /**
   * Firebase Hosting cookie handling workaround, part 1
   *
   * Firebase Hosting only allows the cookie `__session` to
   * be passed through to the our Firebase Functions.
   *
   * The `oidc-provider` package uses multiple cookies
   * for various purposes. Those cookies are going to
   * get stripped out by Firebase Hosting. So, we use
   * a session store to store the cookies that `oidc-provider`
   * would normally send.
   */
  app.use(
    session({
      store: new FirestoreStore({
        database: firestore,
        parser: {
          read(doc) {
            if (doc.session) {
              return JSON.parse(doc.session);
            }

            return doc;
          },
          save(doc) {
            return JSON.parse(JSON.stringify(doc));
          },
        },
      }),
      name: SESSION_COOKIE_NAME,
      secret: cookieKeys,
      resave: false,
      saveUninitialized: false,
      unset: "destroy",
      cookie: {
        path: basePath,
      },
    })
  );

  /**
   * Firebase Hosting cookie handling workaround, part 2
   *
   * Here, we find the cookies that belong to this request's
   * session, and rewrite the Cookie header so that it contains
   * those cookies.
   */
  app.use(async (req, res, next) => {
    try {
      let cookieJar;

      if (req.session && req.session.cookieJar) {
        cookieJar = await CookieJar.deserialize(req.session.cookieJar);

        const url = `${req.protocol}://${req.hostAndPort}${req.url}`;
        const cookies = await cookieJar.getCookies(url, {
          sort: false,
        });

        const cookieHeader = req.get("Cookie");
        let sessionIdCookie;

        if (cookieHeader) {
          const requestCookies = parseCookies(cookieHeader);

          if (requestCookies[SESSION_COOKIE_NAME]) {
            sessionIdCookie = new Cookie({
              key: SESSION_COOKIE_NAME,
              value: requestCookies[SESSION_COOKIE_NAME],
              expires: req.session.cookie.expires,
              maxAge: req.session.cookie.maxAge,
              domain: req.session.cookie.domain,
              path: req.session.cookie.path,
              secure: req.session.cookie.secure,
              httpOnly: req.session.cookie.httpOnly,
              sameSite: req.session.cookie.sameSite,
            });
          }
        }

        if (sessionIdCookie) {
          cookies.push(sessionIdCookie);
        }

        const cookieStr = cookies
          .sort(cookieCompare)
          .map((c) => c.cookieString())
          .join("; ");
        req.headers.cookie = cookieStr;
      } else {
        cookieJar = new CookieJar();
      }

      res.locals.cookieJar = cookieJar;

      next();
    } catch (e) {
      next(e);
    }
  });

  app.get(
    `${basePath}/interaction/:uid/info`,
    setNoCache,
    async (req, res, next) => {
      try {
        await Account.authenticate(oidc, req, res);

        const details = await oidc.interactionDetails(req, res);
        const client = await oidc.Client.find(details.params.client_id);

        res.json({
          interaction: details,
          client,
        });
        next();
      } catch (err) {
        next(err);
      }
    }
  );

  app.post(
    `${basePath}/interaction/:uid/login`,
    setNoCache,
    body,
    async (req, res, next) => {
      try {
        const {
          prompt: { name },
          params: { client_id },
        } = await oidc.interactionDetails(req, res);
        assert.equal(name, "login");

        const account = await Account.authenticate(oidc, req, res);
        const client = await oidc.Client.find(client_id);

        await client.checkUserAccess(account);

        const result = {
          login: {
            account: account.accountId,
          },
        };

        const returnTo = await oidc.interactionResult(req, res, result, {
          mergeWithLastSubmission: false,
        });

        res.json({
          returnTo,
        });
        next();
      } catch (err) {
        next(err);
      }
    }
  );

  app.post(
    `${basePath}/interaction/:uid/confirm`,
    setNoCache,
    body,
    async (req, res, next) => {
      try {
        const {
          prompt: { name },
        } = await oidc.interactionDetails(req, res);
        assert.equal(name, "consent");

        const consent = {};

        // any scopes you do not wish to grant go in here
        //   otherwise details.scopes.new.concat(details.scopes.accepted) will be granted
        consent.rejectedScopes = [];

        // any claims you do not wish to grant go in here
        //   otherwise all claims mapped to granted scopes
        //   and details.claims.new.concat(details.claims.accepted) will be granted
        consent.rejectedClaims = [];

        // replace = false means previously rejected scopes and claims remain rejected
        // changing this to true will remove those rejections in favour of just what you rejected above
        consent.replace = false;

        const result = { consent };
        const returnTo = await oidc.interactionResult(req, res, result, {
          mergeWithLastSubmission: true,
        });

        res.json({
          returnTo,
        });
        next();
      } catch (err) {
        next(err);
      }
    }
  );

  app.get(
    `${basePath}/interaction/:uid/abort`,
    setNoCache,
    async (req, res, next) => {
      try {
        const {
          error = "access_denied",
          error_description = "End-User aborted interaction",
        } = req.query;

        const result = {
          error,
          error_description,
        };

        await oidc.interactionFinished(req, res, result, {
          mergeWithLastSubmission: false,
        });
        next();
      } catch (err) {
        next(err);
      }
    }
  );

  app.use(`${basePath}/interaction`, (err, req, res, next) => {
    if (res.headersSent) {
      next(err);
    }

    errorHandler.logError(err);

    const data = errorHandler.prepareResponseHeadersAndBody(err, res);

    errorHandler.writeHeaders(data, res);

    res.json({
      error: data.body.error,
      error_description: data.body.errorDescription,
    });
  });

  app.use(basePath, oidc.callback);

  /**
   * Firebase Hosting Cookie handling workaround, part 3
   *
   * Here, we take all of the cookies that `oidc-provider`
   * set, and store them in our session store.
   */
  oidc.use(async (ctx, next) => {
    await next();
    const { req, res } = ctx;
    const { cookieJar, destroySession } = res.locals;

    if (destroySession) {
      const sessionCookieOpts = req.session.cookie;
      delete req.session;
      ctx.cookies.set(SESSION_COOKIE_NAME, "", {
        ...sessionCookieOpts,
        expires: new Date(1),
        overwrite: true,
      });
    }

    if (req.session) {
      const url = `${req.protocol}://${req.hostAndPort}${req.url}`;
      const header = res.getHeader("Set-Cookie");
      let cookies;

      if (Array.isArray(header)) {
        cookies = header.map(Cookie.parse);
      } else if (header) {
        cookies = [Cookie.parse(header)];
      }

      if (cookies) {
        await pMap(cookies, (cookie) => {
          return cookieJar.setCookie(cookie, url);
        });
      }

      for (const [key, value] of Object.entries(NO_CACHE_HEADERS)) {
        ctx.set(key, value);
      }

      const serializedCookieJar = await cookieJar.serialize();

      if (req.session.cookieJar) {
        if (!isEqual(req.session.cookieJar, serializedCookieJar)) {
          req.session.cookieJar = serializedCookieJar;
        }
      } else if (serializedCookieJar.cookies.length) {
        req.session.cookieJar = serializedCookieJar;
      }
    }
  });

  return app;
};
