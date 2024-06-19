/* eslint-disable camelcase */
const Provider = require("oidc-provider");
const admin = require("firebase-admin");
const got = require("got");
const jose = require("jose");
const FirestoreAdapter = require("./firestore-adapter");
const Account = require("./account");
const {
  getJwks,
  getCookieKeys,
  getZapierClientInfo,
  getFirebaseAuthApiKey,
  getBrowserExtClientInfo,
} = require("./secrets");
const { getWhatboardUrl, isFunctionsEmulator } = require("../utils");
const { access } = require("../access");

const {
  errors: { AccessDenied, InvalidClientMetadata },
} = Provider;

const getFirebaseIdToken = async (uid, apiKey) => {
  const customToken = await admin.auth().createCustomToken(uid);
  const signinResponse = await got(
    "https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken",
    {
      method: "POST",
      searchParams: {
        key: apiKey,
      },
      json: {
        token: customToken,
        returnSecureToken: true,
      },
      responseType: "json",
    }
  );

  return signinResponse.body.idToken;
};

module.exports = async (issuer, basePath) => {
  const jwks = await getJwks();
  const cookieKeys = await getCookieKeys();
  const zapierClient = await getZapierClientInfo();
  const firebaseAuthApiKey = await getFirebaseAuthApiKey();
  const browserExtClient = await getBrowserExtClientInfo();

  const keystore = jose.JWKS.asKeyStore(jwks);

  const oidc = new Provider(issuer, {
    adapter: FirestoreAdapter,
    clients: [
      {
        client_id: "kbyuFDidLLm280LIwVFiazOqjO3ty8KH",
        client_name: "OpenID Connect Playground",
        client_secret:
          "60Op4HFM0I8ajz0WdiStAbziZ-VFQttXuxixHHs2R7r7-CW8GR79l-mmLqMhc-Sa",
        client_uri: "https://openidconnect.net",
        grant_types: ["implicit", "authorization_code", "refresh_token"],
        redirect_uris: ["https://openidconnect.net/callback"],
        response_types: ["code id_token", "code", "id_token", "none"],
      },
      {
        client_id: "CdrCNNRCVrcMHUG7bHezTtKk28jYZRTB",
        client_name: "Postman",
        client_secret:
          "o#TcNAbqvMLVt8jVYGHTk?NdRi(sCdiRpyxU7ZQkCgvaWnfvtJvwqZi7TzmPrMMm",
        client_uri: "https://www.postman.com",
        grant_types: ["implicit", "authorization_code", "refresh_token"],
        redirect_uris: ["https://oauth.pstmn.io/v1/callback"],
        response_types: ["code id_token", "code", "id_token", "none"],
      },
      {
        client_id: "cUXAn8r-cjGwxz9eP16oXjjt7sEGm18S",
        client_name: "Whatboard API Explorer",
        client_secret:
          "CEhMaEMymgEZjnozDUuBNaRqow9WDmVPJw8WnDyMJDpjxkdR4RNWGVVfTeZNKfjx",
        client_uri: `${getWhatboardUrl()}/api-docs`,
        grant_types: ["implicit", "authorization_code", "refresh_token"],
        redirect_uris: [`${getWhatboardUrl()}/api-docs/oauth2-redirect.html`],
        response_types: ["code id_token", "code", "id_token", "none"],
        token_endpoint_auth_method: "none",
      },
      zapierClient,
      browserExtClient,
    ],
    findAccount: Account.findAccount,
    jwks,
    features: {
      // disable the packaged interactions
      devInteractions: { enabled: false },

      introspection: { enabled: true },
      revocation: { enabled: true },
      rpInitiatedLogout: {
        async logoutSource(ctx, form) {
          // @param ctx - koa request context
          // @param form - form source (id="op.logoutForm") to be embedded in the page and submitted by
          //   the End-User
          const { clientId, clientName } = ctx.oidc.client || {};
          const display = clientName || clientId;
          ctx.body = `<!DOCTYPE html>
          <head>
            <meta charset="utf-8">
            <title>Logout Request</title>
            <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
            <meta http-equiv="x-ua-compatible" content="ie=edge">
            <style>
              @import url(https://fonts.googleapis.com/css?family=Roboto:400,100);button,h1{text-align:center}h1{font-weight:100;font-size:1.3em}body{font-family:Roboto,sans-serif;margin-top:25px;margin-bottom:25px}.container{padding:0 40px 10px;width:274px;background-color:#F7F7F7;margin:0 auto 10px;border-radius:2px;box-shadow:0 2px 2px rgba(0,0,0,.3);overflow:hidden}button{font-size:14px;font-family:Arial,sans-serif;font-weight:700;height:36px;padding:0 8px;width:100%;display:block;margin-bottom:10px;position:relative;border:0;color:#fff;text-shadow:0 1px rgba(0,0,0,.1);background-color:#4d90fe;cursor:pointer}button:hover{border:0;text-shadow:0 1px rgba(0,0,0,.3);background-color:#357ae8}
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Signing out${display ? ` from ${display}` : ""}</h1>
              ${form}
            </div>
            <script type="text/javascript">
              document.getElementById("op.logoutForm").submit();
            </script>
          </body>
          </html>`;
        },
      },
    },
    // https://github.com/panva/node-oidc-provider/blob/main/recipes/claim_configuration.md
    claims: {
      email: ["email", "email_verified"],
      phone: ["phone_number", "phone_number_verified"],
      profile: ["name", "picture"],
    },
    cookies: {
      keys: cookieKeys,
    },
    extraClientMetadata: {
      properties: [
        "urn:whatboard.app:client:accessFunction",
        "urn:whatboard.app:client:accessDeniedMessage",
      ],
      // https://github.com/panva/node-oidc-provider/tree/v6.31.1/docs#extraclientmetadatavalidator
      validator(key, value) {
        if (value === undefined) {
          return;
        }

        switch (key) {
          case "urn:whatboard.app:client:accessFunction":
            if (typeof access[value] !== "function") {
              throw new InvalidClientMetadata(
                `${value} is not a valid access control function`
              );
            }
            break;
          case "urn:whatboard.app:client:accessDeniedMessage":
            if (typeof value !== "string") {
              throw new InvalidClientMetadata(`${value} must be a string`);
            }
            break;
          default:
            break;
        }
      },
    },
    formats: {
      AccessToken: "jwt",
      customizers: {
        async jwt(ctx, token, jwt) {
          const rawToken = await getFirebaseIdToken(
            jwt.payload.sub,
            firebaseAuthApiKey
          );
          const key = keystore.get({ use: "enc" });
          const encToken = jose.JWE.encrypt(rawToken, key);

          // eslint-disable-next-line no-param-reassign
          jwt.payload.fbToken = encToken;
        },
      },
    },
    interactions: {
      url(ctx, interaction) {
        return `${basePath}/interaction/${interaction.uid}`;
      },
    },
    async issueRefreshToken(ctx, client, code) {
      if (!client.grantTypeAllowed("refresh_token")) {
        return false;
      }

      return (
        code.scopes.has("offline_access") ||
        (client.applicationType === "web" &&
          client.tokenEndpointAuthMethod === "none")
      );
    },
    pkce: {
      required: (ctx, client) => {
        return (
          client.applicationType === "native" ||
          client.token_endpoint_auth_method === "none"
        );
      },
    },
  });

  oidc.proxy = true;

  const { invalidate: orig } = oidc.Client.Schema.prototype;

  oidc.Client.Schema.prototype.invalidate = function invalidate(message, code) {
    if (
      isFunctionsEmulator() &&
      (code === "implicit-force-https" || code === "implicit-forbid-localhost")
    ) {
      return;
    }

    orig.call(this, message);
  };

  oidc.Client.prototype.checkUserAccess = async function checkUserAccess(
    account
  ) {
    const accessFunction = this["urn:whatboard.app:client:accessFunction"];
    let accessDeniedMessage = this[
      "urn:whatboard.app:client:accessDeniedMessage"
    ];

    if (!accessDeniedMessage) {
      accessDeniedMessage = "You do not have access to this integration";
    }

    if (!accessFunction) {
      return;
    }

    const wbUser = await account.getWbUser();
    const hasAccess = await access[accessFunction](wbUser);

    if (!hasAccess) {
      const error = new AccessDenied(accessDeniedMessage);
      error.status = 403;
      error.statusCode = 403;

      throw error;
    }
  };

  oidc.use((ctx, next) => {
    if (ctx.path !== "/.well-known/oauth-authorization-server") {
      return next();
    }

    ctx.path = "/.well-known/openid-configuration";
    return next().then(() => {
      ctx.path = "/.well-known/oauth-authorization-server";
    });
  });

  const onEndSessionSuccess = (ctx) => {
    const { res } = ctx;
    res.locals.destroySession = true;
  };

  oidc.on("end_session.success", onEndSessionSuccess);

  const errorEvents = [
    "authorization.error",
    "backchannel.error",
    "jwks.error",
    "check_session_origin.error",
    "check_session.error",
    "discovery.error",
    "end_session.error",
    "grant.error",
    "introspection.error",
    "pushed_authorization_request.error",
    "registration_create.error",
    "registration_delete.error",
    "registration_read.error",
    "registration_update.error",
    "revocation.error",
    "server_error",
    "userinfo.error",
  ];

  const errorHandler = (ctx, error) => {
    console.error(error);
  };

  for (const event of errorEvents) {
    oidc.on(event, errorHandler);
  }

  return oidc;
};
