#!/usr/bin/env node

require("./fb-admin-init");
const { Command } = require("commander");
const dumpUser = require("./commands/dump-user");
const migrateBlocks = require("./commands/migrate-blocks");
const setupCustomClaims = require("./commands/setup-custom-claims");
const removeCustomClaims = require("./commands/remove-custom-claims");
const giveSubRole = require("./commands/give-sub-role");
const removeSubRole = require("./commands/remove-sub-role");
const initBoardUsage = require("./commands/init-board-usage");
const initRoles = require("./commands/init-roles");
const changeBuckets = require("./commands/change-buckets");
const initStorageUsage = require("./commands/init-storage-usage");
const updateUserBoards = require("./commands/update-user-boards");
const fixFileDownloads = require("./commands/fix-file-downloads");
const resetBoardLimit = require("./commands/reset-board-limit");

const program = new Command();

program.version("1.0.0").description("Whatboard Admin Tasks");

const commands = [
  dumpUser,
  migrateBlocks,
  setupCustomClaims,
  removeCustomClaims,
  giveSubRole,
  removeSubRole,
  initBoardUsage,
  initRoles,
  changeBuckets,
  initStorageUsage,
  updateUserBoards,
  fixFileDownloads,
  resetBoardLimit,
];

commands.forEach((command) => {
  command(program);
});

(async () => {
  try {
    await program.parseAsync(process.argv);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
