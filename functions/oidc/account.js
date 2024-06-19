const admin = require("firebase-admin");
const Provider = require("oidc-provider");
const { makeUser } = require("../access");

const {
  errors: { OIDCProviderError, AccessDenied, InvalidToken },
} = Provider;

class Account {
  #wbUser;

  /**
   * Retrive an account by its ID
   *
   * @param ctx
   *   Koa request context.
   * @param sub {string}
   *   Account identifier (subject).
   * @param token
   *   Is a reference to the token used for which a given account is being loaded,
   *   is undefined in scenarios where claims are returned from authorization endpoint.
   *
   * @returns {Promise<Account>|undefined}
   *
   * @see https://github.com/panva/node-oidc-provider/tree/main/docs#findaccount
   */
  // eslint-disable-next-line no-unused-vars
  static async findAccount(ctx, sub, token) {
    try {
      const fbUser = await admin.auth().getUser(sub);

      if (fbUser.disabled) {
        const error = new AccessDenied(`User ID ${sub} is disabled`);
        error.status = 403;
        error.statusCode = 403;

        throw error;
      }

      const account = new Account(fbUser);

      return account;
    } catch (e) {
      if (e.code === "auth/user-not-found") {
        return undefined;
      }

      throw e;
    }
  }

  /**
   * Authenticate a requrest
   *
   * @param {import('oidc-provider').Provider} provider
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   *
   * @returns {Promise<Account>}
   */
  static async authenticate(provider, req, res) {
    if (
      !req.headers.authorization ||
      !req.headers.authorization.startsWith("Bearer ")
    ) {
      const error = new InvalidToken("No access token provided");

      throw error;
    }

    const idToken = req.headers.authorization.split("Bearer ")[1];

    try {
      const decodedIdToken = await admin.auth().verifyIdToken(idToken);
      const ctx = provider.app.createContext(req, res);

      const account = Account.findAccount(ctx, decodedIdToken.sub);

      if (!account) {
        const error = new InvalidToken(
          `Cannot find user with ID ${decodedIdToken.sub}`
        );

        throw error;
      }

      return account;
    } catch (e) {
      if (e instanceof OIDCProviderError) {
        throw e;
      }

      const error = new InvalidToken(`Invalid access token: ${e.message}`);

      throw error;
    }
  }

  /**
   * @param { import("firebase-admin").auth.UserRecord } fbUser
   */
  constructor(fbUser) {
    this.fbUser = fbUser;
  }

  /**
   * Retrieve the ID for this account
   *
   * @returns {string}
   *
   * @see https://github.com/panva/node-oidc-provider/tree/main/docs#findaccount
   */
  get accountId() {
    return this.fbUser.uid;
  }

  async getWbUser() {
    if (this.#wbUser === undefined) {
      this.#wbUser = await makeUser(this.fbUser);
    }

    return this.#wbUser;
  }

  /**
   * Retrieve a set of OIDC claims applicable to this account
   *
   * @param use {string}
   *   Can either be "id_token" or "userinfo", depending on where the specific claims
   *   are intended to be put in.
   * @param scope {string}
   *   The intended scope. While oidc-provider will mask claims depending on the scope
   *   automatically you might want to skip loading some claims from external resources
   *   or through db projection etc. based on this detail or not return them in ID Tokens
   *   but only UserInfo and so on.
   * @param claims {object}
   *   The part of the claims authorization parameter for either "id_token" or "userinfo"
   *   (depends on the "use" param).
   * @param rejected {Array[String]}
   *   Claim names that were rejected by the end-user, you might want to skip loading some
   *   claims from external resources or through db projection.
   *
   * @returns {Promise<Object>}
   *
   * @see https://github.com/panva/node-oidc-provider/tree/main/docs#findaccount
   */
  // eslint-disable-next-line no-unused-vars
  async claims(use, scope, claims, rejected) {
    return {
      sub: this.accountId,
      email: this.fbUser.email,
      // eslint-disable-next-line camelcase
      email_verified: this.fbUser.emailVerified,
      phone: this.fbUser.phoneNumber,
      // eslint-disable-next-line camelcase
      phone_number_verified: true,
      name: this.fbUser.displayName,
      picture: this.fbUser.photoURL,
    };
  }
}

module.exports = Account;
