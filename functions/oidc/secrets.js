/* eslint-disable camelcase */
const { SecretManagerServiceClient } = require("@google-cloud/secret-manager");
const { getWhatboardUrl } = require("../utils");

const secretManager = new SecretManagerServiceClient();

exports.getFirebaseAuthApiKey = async () => {
  const projectId = await secretManager.getProjectId();

  const firebaseAuthApiKeySecretVersion = secretManager.secretVersionPath(
    projectId,
    "firebase-auth-api-key",
    "latest"
  );

  const [version] = await secretManager.accessSecretVersion({
    name: firebaseAuthApiKeySecretVersion,
  });

  const payload = version.payload.data.toString();

  return payload;
};

exports.getJwks = async () => {
  const projectId = await secretManager.getProjectId();

  const jwksSecretVersion = secretManager.secretVersionPath(
    projectId,
    "oidc-jwks",
    "latest"
  );

  const [version] = await secretManager.accessSecretVersion({
    name: jwksSecretVersion,
  });

  const payload = version.payload.data.toString();

  const jwks = JSON.parse(payload);

  return jwks;
};

exports.getCookieKeys = async () => {
  const projectId = await secretManager.getProjectId();

  const cookieKeysSecretVersion = secretManager.secretVersionPath(
    projectId,
    "oidc-cookie-keys",
    "latest"
  );

  const [version] = await secretManager.accessSecretVersion({
    name: cookieKeysSecretVersion,
  });

  const payload = version.payload.data.toString();

  return [payload];
};

exports.getZapierClientInfo = async () => {
  const projectId = await secretManager.getProjectId();

  const zapierClientIdSecretVersion = secretManager.secretVersionPath(
    projectId,
    "zapier-oidc-client-id",
    "latest"
  );

  const [clientIdVersion] = await secretManager.accessSecretVersion({
    name: zapierClientIdSecretVersion,
  });

  const zapierClientId = clientIdVersion.payload.data.toString();

  const zapierClientSecretSecretVersion = secretManager.secretVersionPath(
    projectId,
    "zapier-oidc-client-secret",
    "latest"
  );

  const [clientSecretVersion] = await secretManager.accessSecretVersion({
    name: zapierClientSecretSecretVersion,
  });

  const zapierClientSecret = clientSecretVersion.payload.data.toString();

  return {
    client_id: zapierClientId,
    client_name: "Zapier",
    client_secret: zapierClientSecret,
    client_uri: "https://www.zapier.com",
    policy_uri: "https://zapier.com/privacy",
    grant_types: ["authorization_code", "refresh_token"],
    redirect_uris: [
      "https://zapier.com/dashboard/auth/oauth/return/WhatboardCLIAPI/",
    ],
    tos_uri: "https://zapier.com/legal",
    token_endpoint_auth_method: "client_secret_post",
    "urn:whatboard.app:client:accessFunction": "canAccessZapierIntegration",
    "urn:whatboard.app:client:accessDeniedMessage":
      "The Whatboard Zapier Integration is only available to paid users",
  };
};

exports.getBrowserExtClientInfo = async () => {
  const projectId = await secretManager.getProjectId();

  const browserExtClientIdSecretVersion = secretManager.secretVersionPath(
    projectId,
    "browser-ext-oidc-client-id",
    "latest"
  );

  const [clientIdVersion] = await secretManager.accessSecretVersion({
    name: browserExtClientIdSecretVersion,
  });

  const browserExtClientId = clientIdVersion.payload.data.toString();

  const browserExtClientSecretSecretVersion = secretManager.secretVersionPath(
    projectId,
    "browser-ext-oidc-client-secret",
    "latest"
  );

  const [clientSecretVersion] = await secretManager.accessSecretVersion({
    name: browserExtClientSecretSecretVersion,
  });

  const browserExtClientSecret = clientSecretVersion.payload.data.toString();

  return {
    client_id: browserExtClientId,
    client_name: "Whatboard Browser Extension",
    client_secret: browserExtClientSecret,
    client_uri: "https://whatboard.app",
    policy_uri: "https://whatboard.app/privacy",
    grant_types: ["implicit", "authorization_code", "refresh_token"],
    redirect_uris: [
      "https://npaccllkphikfkdbmedailkemffjffgg.chromiumapp.org/sign-in-callback",
      "https://jaehimpcikljgmipgcklljgccoafekof.chromiumapp.org/sign-in-callback",
    ],
    tos_uri: "https://whatboard.app/terms",
    token_endpoint_auth_method: "none",
    post_logout_redirect_uris: [
      `${getWhatboardUrl()}/browser-ext/chrome/logout?extensionId=npaccllkphikfkdbmedailkemffjffgg`,
      `${getWhatboardUrl()}/browser-ext/chrome/logout?extensionId=jaehimpcikljgmipgcklljgccoafekof`,
      // Deprecated URIs. Remove them when they are no longer being used by the Browser Extension.
      "https://npaccllkphikfkdbmedailkemffjffgg.chromiumapp.org/sign-out-callback",
      "https://jaehimpcikljgmipgcklljgccoafekof.chromiumapp.org/sign-out-callback",
    ],
    "urn:whatboard.app:client:accessFunction": "canAccessBrowserExtension",
    "urn:whatboard.app:client:accessDeniedMessage":
      "The Whatboard Browser Extension is only available to paid users",
  };
};
