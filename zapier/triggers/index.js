const boardCreated = require("./boardCreated");
// const boardUpdated = require("./boardUpdated");
const boardDeleted = require("./boardDeleted");
const boardPublic = require("./boardPublic");
const boardPrivate = require("./boardPrivate");
const boardArchived = require("./boardArchived");
const boardInvited = require("./boardInvited");
const boardViewed = require("./boardViewed");
const boardContentModified = require("./boardContentModified");
const blockCreated = require("./blockCreated");
const blockUpdated = require("./blockUpdated");
const qaAnswerUpdated = require("./qaAnswerUpdated");
const conversationUpdated = require("./conversationUpdated");

module.exports = {
  [boardCreated.key]: boardCreated,
  // [boardUpdated.key]: boardUpdated,
  [boardDeleted.key]: boardDeleted,
  [boardPublic.key]: boardPublic,
  [boardPrivate.key]: boardPrivate,
  [boardArchived.key]: boardArchived,
  [boardInvited.key]: boardInvited,
  [boardViewed.key]: boardViewed,
  [boardContentModified.key]: boardContentModified,
  [blockCreated.key]: blockCreated,
  [blockUpdated.key]: blockUpdated,
  [qaAnswerUpdated.key]: qaAnswerUpdated,
  [conversationUpdated.key]: conversationUpdated,
};
