#!/usr/bin/env node

const execa = require("execa");
const fs = require("fs");
const _ = require("lodash");

const runtimeConfigPath = `${__dirname}/../functions/.runtimeconfig.json`;
const firebaseRuntimeConfigPath = `${__dirname}/../functions/.runtimeconfig.firebase.json`;
const localRuntimeConfigPath = `${__dirname}/../functions/.runtimeconfig.local.json`;

(async () => {
  const child = execa.command("firebase functions:config:get");
  child.stdout.pipe(fs.createWriteStream(firebaseRuntimeConfigPath));
  await child;

  // eslint-disable-next-line global-require, import/no-dynamic-require
  let runtimeConfig = require(firebaseRuntimeConfigPath);

  if (fs.existsSync(localRuntimeConfigPath)) {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const localRuntimeConfig = require(localRuntimeConfigPath);
    runtimeConfig = _.merge(runtimeConfig, localRuntimeConfig);
  }

  fs.writeFileSync(runtimeConfigPath, JSON.stringify(runtimeConfig, null, 2));
})();
