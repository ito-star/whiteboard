const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { getWhatboardUrl, getMailgunClient } = require("./utils");

/**
 * Send an invitation to a Whatboard
 */
const sendInvitation = async (email, boardHash, board, subject, sender) => {
  let user = {};

  try {
    user = await admin.auth().getUserByEmail(email);
  } catch (e) {
    if (e.code === "auth/user-not-found") {
      user = {
        displayName: email,
        email,
      };
    } else {
      throw e;
    }
  }

  const templateName = "board-invite";

  // When developing a template, you can set this to the version tag you are working on.
  // Once you're done, set that version tag to "active", then set this variable back
  // to "undefined".
  const templateVersion = undefined;

  const whatboardDomain = getWhatboardUrl();

  const whatboardUrl = `${whatboardDomain}/accept-invite/${boardHash}`;

  const templateVariables = {
    // eslint-disable-next-line camelcase
    display_name: user.displayName,
    // eslint-disable-next-line camelcase
    invitee_name: user.displayName,
    // eslint-disable-next-line camelcase
    invitee_email: user.email,
    // eslint-disable-next-line camelcase
    whatboard_name: board.board_name,
    // eslint-disable-next-line camelcase
    whatboard_url: whatboardUrl,
    // eslint-disable-next-line camelcase
    sender_name: sender.displayName,
    // eslint-disable-next-line camelcase
    sender_email: sender.email,
  };

  const defaultSubject = `${sender.displayName} has invited you to the Whatboard "${board.board_name}"`;

  const params = {
    from: `${sender.displayName} (via Whatboard) <noreply@mg.whatboard.app>`,
    to: [`${user.displayName}  <${user.email}>`],
    "h:Reply-To": `${sender.displayName} <${sender.email}>`,
    subject: subject || defaultSubject,
    template: templateName,
    "t:version": templateVersion,
    "t:text": "yes",
    "o:tag": ["board-invite"],
    "h:X-Mailgun-Variables": JSON.stringify(templateVariables),
  };

  const mg = getMailgunClient();
  return mg.messages.create(functions.config().mailgun.domain, params);
};

module.exports = sendInvitation;
