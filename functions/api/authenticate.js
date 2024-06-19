const admin = require("firebase-admin");
const jose = require("jose");
const createError = require("http-errors");
const issuerUrl = require("../oidc/issuer-url");
const { getJwks } = require("../oidc/secrets");
const { makeUserFromUid } = require("../access");

let KEYSTORE;

/**
 *
 * @returns {Promise<import("jose").JWKS.KeyStore>}
 */
const getKeystore = async () => {
  if (!KEYSTORE) {
    const keyset = await getJwks();
    KEYSTORE = jose.JWKS.asKeyStore(keyset);
  }

  return KEYSTORE;
};

const unauthenticated = (description) => {
  const message = "invalid_token";

  const error = createError(401, message, {
    errorDescription: description,
  });

  return error;
};

const authenticate = async (req) => {
  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith("Bearer ")
  ) {
    throw unauthenticated("No access token provided");
  }

  const accessToken = req.headers.authorization.split("Bearer ")[1];

  if (!accessToken) {
    throw unauthenticated("No access token provided");
  }

  const jwks = await getKeystore();

  try {
    const decodedToken = jose.JWT.verify(accessToken, jwks, {
      issuer: issuerUrl,
    });

    const user = await makeUserFromUid(decodedToken.sub);

    const encrypytedFbToken = decodedToken.fbToken;
    const decrypytedFbToken = jose.JWE.decrypt(encrypytedFbToken, jwks);
    const fbToken = decrypytedFbToken.toString();
    user.token.firebase = await admin.auth().verifyIdToken(fbToken);
    user.token.firebaseStr = fbToken;

    return user;
  } catch (e) {
    if (e instanceof jose.errors.JOSEError) {
      throw unauthenticated(e.message);
    }

    if (e.code && e.code.startsWith && e.code.startsWith("auth/")) {
      throw unauthenticated(e.message);
    }

    throw e;
  }
};

module.exports = authenticate;
