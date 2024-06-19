const functions = require("firebase-functions");
const admin = require("firebase-admin");
const {
  isDev,
  getWhatboardUrl,
  idToEmail,
  getMailgunClient,
} = require("./utils");

const sendReport = async (
  recipient,
  board,
  boardUrl,
  reporter,
  reportReason,
  templateName,
  templateVersion,
  templateVars = {},
  tags = []
) => {
  let user = {
    uid: "",
  };

  const ownerEmail = idToEmail(board.board_members[0]);

  user = await admin.auth().getUserByEmail(ownerEmail);

  const templateVariables = {
    ...templateVars,
    // eslint-disable-next-line camelcase
    reporter_name: reporter.displayName,
    // eslint-disable-next-line camelcase
    reporter_email: reporter.email,
    board_name: board.board_name,
    // eslint-disable-next-line camelcase
    board_url: boardUrl,
    // eslint-disable-next-line camelcase
    owner_name: user.displayName,
    // eslint-disable-next-line camelcase
    owner_email: ownerEmail,
    // eslint-disable-next-line camelcase
    report_reason: reportReason,
  };

  const params = {
    from: "Whatboard LLC <tos-violation@mg.whatboard.app>",
    to: [`${recipient.displayName}  <${recipient.email}>`],
    subject: `Whatboard Terms of Service Violation Report for Board "${
      board.board_name
    }" from ${reporter.email || reporter.displayName}`,
    template: templateName,
    "t:version": templateVersion,
    "t:text": "yes",
    "o:tag": ["tos-violation", ...tags],
    "h:X-Mailgun-Variables": JSON.stringify(templateVariables),
  };

  const mg = getMailgunClient();
  return mg.messages.create(functions.config().mailgun.domain, params);
};

/**
 * Send a Report to a Whatboard
 */
const sendAdminReport = async (
  board_id,
  readOnlyId,
  board,
  reporter,
  reportReason
) => {
  let user = {
    uid: "",
  };

  const ownerEmail = idToEmail(board.board_members[0]);

  user = await admin.auth().getUserByEmail(ownerEmail);

  let email;

  if (isDev()) {
    if (reporter.email) {
      email = reporter.email;
    } else {
      email = ownerEmail;
    }
  }

  if (!email) {
    email = "complaint@whatboard.app";
  }

  const whatboardDomain = getWhatboardUrl();
  const reportedBoardURL = readOnlyId
    ? `${whatboardDomain}/readonlyboard/${board_id}?invitation=${readOnlyId}`
    : `${whatboardDomain}/board/${board_id}`;
  const removeBoardURL = `${whatboardDomain}/reported-board/remove-board?id=${board_id}`;
  const disableUserURL = `${whatboardDomain}/reported-board/disable-user?id=${user.uid}`;
  const removeUserURL = `${whatboardDomain}/reported-board/remove-user?id=${user.uid}`;
  const templateName = "tos-violation-admin";

  // When developing a template, you can set this to the version tag you are working on.
  // Once you're done, set that version tag to "active", then set this variable back
  // to "undefined".
  const templateVersion = undefined;

  const recipient = {
    displayName: "Support Team",
    email,
  };

  const templateVariables = {
    // eslint-disable-next-line camelcase
    delete_board_url: removeBoardURL,
    // eslint-disable-next-line camelcase
    disable_user_url: disableUserURL,
    // eslint-disable-next-line camelcase
    delete_user_url: removeUserURL,
  };

  const tags = ["tos-volation-admin"];

  return sendReport(
    recipient,
    board,
    reportedBoardURL,
    reporter,
    reportReason,
    templateName,
    templateVersion,
    templateVariables,
    tags
  );
};

const sendOwnerReport = async (
  board_id,
  readOnlyId,
  board,
  reporter,
  reportReason
) => {
  let user = {
    uid: "",
  };

  const ownerEmail = idToEmail(board.board_members[0]);

  user = await admin.auth().getUserByEmail(ownerEmail);

  const whatboardDomain = getWhatboardUrl();
  const reportedBoardURL = `${whatboardDomain}/board/${board_id}`;
  const templateName = "tos-violation-owner";

  // When developing a template, you can set this to the version tag you are working on.
  // Once you're done, set that version tag to "active", then set this variable back
  // to "undefined".
  const templateVersion = undefined;

  const recipient = {
    displayName: user.displayName,
    email: ownerEmail,
  };

  const templateVariables = {};

  const tags = ["tos-violation-owner"];

  // Don't send the actual reporter info to the Board owner
  const hiddenReporter = {
    displayName: "",
    email: "",
  };

  return sendReport(
    recipient,
    board,
    reportedBoardURL,
    hiddenReporter,
    reportReason,
    templateName,
    templateVersion,
    templateVariables,
    tags
  );
};

const sendAllReports = async (
  board_id,
  readOnlyId,
  board,
  reporter,
  reportReason
) => {
  return Promise.all([
    sendAdminReport(board_id, readOnlyId, board, reporter, reportReason),
    sendOwnerReport(board_id, readOnlyId, board, reporter, reportReason),
  ]);
};

module.exports = { sendAllReports, sendAdminReport };
