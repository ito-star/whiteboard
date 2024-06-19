const functions = require("firebase-functions");
const { isDev, assertAppCheck, getMailgunClient } = require("./utils");
const { wrapEventFunction } = require("./sentry");

exports.sendSupport = functions.https.onCall(
  wrapEventFunction(
    async (data, context) => {
      assertAppCheck(context);
      const { subject, content, supporter, supporterEmail } = data;

      let email;

      if (isDev()) {
        email = context.auth && context.auth.token.email;
      }

      if (!email) {
        email = "support@whatboard.app";
      }

      const templateName = "support";

      // When developing a template, you can set this to the version tag you are working on.
      // Once you're done, set that version tag to "active", then set this variable back
      // to "undefined".
      const templateVersion = undefined;

      const templateVariables = {
        // eslint-disable-next-line camelcase
        support_subject: subject,
        // eslint-disable-next-line camelcase
        support_content: content,
        // eslint-disable-next-line camelcase
        sender_name: supporter,
        // eslint-disable-next-line camelcase
        sender_email: supporterEmail,
      };

      const params = {
        from: "Whatboard LLC <support-form@mg.whatboard.app>",
        to: [`Support Team  <${email}>`],
        "h:Reply-To": `${supporter} <${supporterEmail}>`,
        subject: `Whatboard Support Form Submission (${subject}) from ${supporterEmail}`,
        template: templateName,
        "t:version": templateVersion,
        "t:text": "yes",
        "o:tag": ["support-form"],
        "h:X-Mailgun-Variables": JSON.stringify(templateVariables),
      };

      const mg = getMailgunClient();
      return mg.messages.create(functions.config().mailgun.domain, params);
    },
    { functionName: "boards-resendInvitation" }
  )
);
