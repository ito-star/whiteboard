#!/usr/bin/env node

/**
 * dotenv-load uses shelljs to run commands.
 *
 * The problem is that shelljs doesn't work
 * with interactive commands very well. So,
 * we use this script instead
 */

const execa = require("execa");
const dotenvLoad = require("dotenv-load");

dotenvLoad();

const command = process.argv[2];
const args = process.argv.slice(3);

const child = execa(command, args, {
  stdio: "inherit",
});

child.on("close", (code) => {
  process.exit(code);
});

["SIGINT", "SIGTERM", "SIGHUP", "SIGQUIT"].forEach((signal) => {
  process.on(signal, () => {
    child.kill(signal);
  });
});
