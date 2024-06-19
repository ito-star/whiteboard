const fs = require("fs");
const path = require("path");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Sentry = require("@sentry/serverless");
require("@sentry/tracing");
const { stringToBool, isDev, isFunctionsEmulator } = require("./utils");

let sentryEnabled;
let sentryEnvironment;
let sentryRelease;
let sentryDebug;

if (isFunctionsEmulator()) {
  sentryEnabled = stringToBool(process.env.REACT_APP_SENTRY_ENABLED);
  sentryEnvironment = process.env.REACT_APP_SENTRY_ENVIRONMENT || "development";
  sentryRelease = process.env.REACT_APP_SENTRY_RELEASE;
  sentryDebug = stringToBool(process.env.REACT_APP_SENTRY_DEBUG);
} else {
  const sentryConfig = functions.config().sentry || {};
  sentryEnabled = sentryConfig.enabled || !isDev();
  sentryEnvironment =
    sentryConfig.environment || (isDev() ? "development" : "production");
  sentryRelease = sentryConfig.release;
  sentryDebug = sentryConfig.debug;
}

Sentry.GCPFunction.init({
  enabled: sentryEnabled,
  debug: sentryDebug,
  dsn:
    "https://952cf3c6fa4b4db399496db6e16dea63@o450530.ingest.sentry.io/5435064",
  environment: sentryEnvironment,
  release: sentryRelease,
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
  ],
  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 1.0,
});

if (isFunctionsEmulator()) {
  const serviceAccountFile = path.resolve(
    __dirname,
    "./serviceAccountKey.json"
  );

  // serviceAccountKey.json was introduced in PR #1022
  // and may not exist yet on the local machine.
  // If it doesn't, check for the Admin Scripts' service
  // account key file and copy that.
  if (!fs.existsSync(serviceAccountFile)) {
    const adminServiceAccountFile = path.resolve(
      __dirname,
      "../admin/serviceAccountKey.whatboard-dev.json"
    );

    if (fs.existsSync(adminServiceAccountFile)) {
      console.log(
        `Copying ${adminServiceAccountFile} to ${serviceAccountFile}`
      );
      fs.copyFileSync(adminServiceAccountFile, serviceAccountFile);
    } else {
      throw new Error(
        `Service Account file ${serviceAccountFile} is missing! Please see the "Firebase Functions Setup" section of the README for instructions on how to create this file.`
      );
    }
  }

  const serviceAccountJSON = fs.readFileSync(serviceAccountFile, "utf-8");
  const serviceAccount = JSON.parse(serviceAccountJSON);

  admin.initializeApp({
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
    credential: admin.credential.cert(serviceAccount),
  });
} else {
  admin.initializeApp();
}

exports.qahook = require("./qahook");
exports.mixmax = require("./mixmax");
exports.boards = require("./boards");
exports.blocks = require("./blocks");
exports.chats = require("./chats");
exports.users = require("./users");
exports.support = require("./support");
exports.files = require("./files");
// eslint-disable-next-line camelcase
exports.cors_proxy = require("./cors-proxy");
exports.zapier = require("./zapier");
exports.oidc = require("./oidc");
exports.api = require("./api");
// eslint-disable-next-line camelcase
exports.api_docs = require("./api-docs");
// eslint-disable-next-line camelcase
exports.api_specs = require("./api-specs");
exports.crons = require("./crons");
exports.storage = require("./storage");
