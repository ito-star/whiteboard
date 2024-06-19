import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import _isPlainObject from "lodash/isPlainObject";
import _isArray from "lodash/isArray";
import _clone from "lodash/clone";
import _map from "lodash/map";
import _includes from "lodash/includes";
import { initFirebase } from "../utils";

initFirebase();

/**
 * Display name for the Firebase Auth providers
 *
 * See https://github.com/firebase/firebaseui-web/blob/e025211b61efbbf6d81f1321a5aee2c6cfaf8eaa/javascript/ui/page/base.js#L95
 */
export const AUTH_PROVIDER_NAMES = {
  "google.com": "Google",
  "github.com": "GitHub",
  "facebook.com": "Facebook",
  "twitter.com": "Twitter",
  password: "Email",
  phone: "Phone",
  anonymous: "Guest",
  "microsoft.com": "Microsoft",
  "yahoo.com": "Yahoo",
  "apple.com": "Apple",
};

/**
 * Supported IdP auth provider.
 * @package {Object<string, firebase.auth.AuthProvider>}
 */
const AuthProviders = {
  "facebook.com": "FacebookAuthProvider",
  "github.com": "GithubAuthProvider",
  "google.com": "GoogleAuthProvider",
  password: "EmailAuthProvider",
  "twitter.com": "TwitterAuthProvider",
  phone: "PhoneAuthProvider",
};

/**
 * FirebaseUI supported providers in sign in option.
 * @const {!Array<string>}
 */
const UI_SUPPORTED_PROVIDERS = ["anonymous"];

/** @private @const {string} The required SAML provider ID prefix. */
const SAML_PREFIX = "saml.";

export const fbUiSignInOptions = [
  {
    provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
    providerName: "Email",
  },
  {
    provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    providerName: "Google",
  },
  {
    provider: firebase.auth.FacebookAuthProvider.PROVIDER_ID,
    providerName: "Facebook",
  },
];

export const isExternalProvider = (providerData) => {
  switch (providerData.providerId) {
    case firebase.auth.EmailAuthProvider.PROVIDER_ID:
    case firebase.auth.PhoneAuthProvider.PROVIDER_ID:
      return false;
    default:
      return true;
  }
};

/**
 * @param {string} providerId The provider ID of the provider in question.
 * @return {boolean} Whether the provider is supported.
 */
const isSupportedProvider = (providerId) => !!AuthProviders[providerId];

/**
 * Returns the normalized list of valid user-enabled IdPs.
 * The user may specify each IdP as just a provider ID or as an object
 * containing provider ID and additional scopes; this method converts all
 * entries to the object format and filters out entries with invalid
 * providers.
 * @return {!Array<?Object>} The normalized sign-in options.
 * @private
 */
const getSignInOptions = () => {
  const signInOptions = fbUiSignInOptions || [];
  const normalizedOptions = [];

  for (let i = 0; i < signInOptions.length; i += 1) {
    const providerConfig = signInOptions[i];

    // If the config is not in object format, convert to object format.
    const normalizedConfig = _isPlainObject(providerConfig)
      ? providerConfig
      : { provider: providerConfig };

    if (normalizedConfig.provider) {
      normalizedOptions.push(normalizedConfig);
    }
  }

  return normalizedOptions;
};

/**
 * Returns the normalized signInOptions for the specified provider.
 * @param {string} providerId The provider id whose signInOptions are to be
 *     returned.
 * @return {?Object} The normalized sign-in options for the specified
 *     provider.
 * @private
 */
const getSignInOptionsForProvider = (providerId) => {
  const signInOptions = getSignInOptions();

  // For each sign-in option.
  for (let i = 0; i < signInOptions.length; i += 1) {
    // Check if current option matches provider ID.
    if (signInOptions[i].provider === providerId) {
      return signInOptions[i];
    }
  }

  return null;
};

/**
 * @param {string} providerId The provider id whose additional scopes are to
 *     be returned.
 * @return {!Array<string>} The list of additional scopes for specified
 *     provider.
 */
const getProviderAdditionalScopes = (providerId) => {
  // Get provided sign-in options for specified provider.
  const signInOptions = getSignInOptionsForProvider(providerId);
  const scopes = signInOptions && signInOptions.scopes;

  return _isArray(scopes) ? scopes : [];
};

/**
 * @param {string} providerId The provider id whose custom parameters are to
 *     be returned.
 * @return {?Object} The custom parameters for the current provider.
 */
const getProviderCustomParameters = (providerId) => {
  // Get provided sign-in options for specified provider.
  const signInOptions = getSignInOptionsForProvider(providerId);
  // Get customParameters for that provider if available.
  const customParameters = signInOptions && signInOptions.customParameters;

  // Custom parameters must be an object.
  if (_isPlainObject(customParameters)) {
    // Clone original custom parameters.
    const clonedCustomParameters = _clone(customParameters);

    // Delete login_hint from Google provider as it could break the flow.
    if (providerId === firebase.auth.GoogleAuthProvider.PROVIDER_ID) {
      // delete clonedCustomParameters.login_hint;
    }

    // Delete login from GitHub provider as it could break the flow.
    if (providerId === firebase.auth.GithubAuthProvider.PROVIDER_ID) {
      delete clonedCustomParameters.login;
    }

    return clonedCustomParameters;
  }

  return null;
};

/**
 * @param {string} providerId
 * @return {boolean} Whether the provider is a SAML provider.
 * @private
 */
const isSaml = (providerId) => providerId.indexOf(SAML_PREFIX) === 0;

/**
 * Returns all available provider configs. For built-in providers, provider
 * display name, button color and icon URL are fixed and cannot be overridden.
 * @return {!Array<!Config.ProviderConfig>} The list of supported IdP configs.
 */
const getProviderConfigs = () =>
  _map(getSignInOptions(), (option) => {
    if (
      isSupportedProvider(option.provider) ||
      _includes(UI_SUPPORTED_PROVIDERS, option.provider)
    ) {
      // The login hint key is also automatically set for built-in providers
      // that support it.
      const providerConfig = {
        providerId: option.provider,
        // Since developers may be using G-Suite for Google sign in or
        // want to label email/password as their own provider, we should
        // allow customization of these attributes.
        providerName: option.providerName || null,
        fullLabel: option.fullLabel || null,
        buttonColor: option.buttonColor || null,
        iconUrl: option.iconUrl || null,
      };

      Object.keys(providerConfig).forEach((key) => {
        if (providerConfig[key] === null) {
          delete providerConfig[key];
        }
      });

      return providerConfig;
    }
    return {
      providerId: option.provider,
      providerName: option.providerName || null,
      fullLabel: option.fullLabel || null,
      buttonColor: option.buttonColor || null,
      iconUrl: option.iconUrl || null,
      loginHintKey: option.loginHintKey || null,
    };
  });

/**
 * @param {string} providerId The provider id whose sign in provider config
 *     is to be returned.
 * @return {?Config.ProviderConfig} The list of sign in provider configs for
 *     supported IdPs.
 */
const getConfigForProvider = (providerId) => {
  const providerConfigs = getProviderConfigs();

  for (let i = 0; i < providerConfigs.length; i += 1) {
    // Check if current option matches provider ID.
    if (providerConfigs[i].providerId === providerId) {
      return providerConfigs[i];
    }
  }

  return null;
};

/**
 * Returns the provider by provider ID. If the provider ID is neither a built-in
 * provider or SAML provider, it will be considered as a generic OAuth provider.
 * @param {string} providerId
 * @return {!firebase.auth.AuthProvider} The IdP.
 */
const getAuthProviderInstance = (providerId) => {
  if (AuthProviders[providerId] && firebase.auth[AuthProviders[providerId]]) {
    return new firebase.auth[AuthProviders[providerId]]();
  }
  if (isSaml(providerId)) {
    return new firebase.auth.SAMLAuthProvider(providerId);
  }
  return new firebase.auth.OAuthProvider(providerId);
};

export const getAuthProvider = (providerId, email) => {
  // Construct provider and pass additional scopes.
  const provider = getAuthProviderInstance(providerId);

  // Provider must be provided for any action to be taken.
  if (!provider) {
    // This shouldn't happen.
    throw new Error("Invalid Firebase Auth provider!");
  }

  // Get additional scopes for requested provider.
  const additionalScopes = getProviderAdditionalScopes(providerId);

  // Some providers like Twitter do not accept additional scopes.
  if (provider.addScope) {
    // Add every requested additional scope to the provider.
    for (let i = 0; i < additionalScopes.length; i += 1) {
      provider.addScope(additionalScopes[i]);
    }
  }

  // Get custom parameters for the selected provider.
  const customParameters = getProviderCustomParameters(providerId) || {};

  // Some providers accept an email address as a login hint. If the email is
  // set and if the provider supports it, add it to the custom paramaters.
  if (email) {
    let loginHintKey;

    // Since the name of the parameter is known for Google and GitHub, set this
    // automatically. Google and GitHub are the only default providers which
    // support a login hint.
    if (providerId === firebase.auth.GoogleAuthProvider.PROVIDER_ID) {
      loginHintKey = "login_hint";
    } else if (providerId === firebase.auth.GithubAuthProvider.PROVIDER_ID) {
      loginHintKey = "login";
    } else {
      // For other providers, check if the name is set in the configuration.
      const providerConfig = getConfigForProvider(providerId);
      loginHintKey = providerConfig && providerConfig.loginHintKey;
    }

    // If the hint is set, add the email to the custom parameters.
    if (loginHintKey) {
      customParameters[loginHintKey] = email;
    }
  }

  // Set the custom parameters if applicable for the current provider.
  if (provider.setCustomParameters) {
    provider.setCustomParameters(customParameters);
  }

  return provider;
};
