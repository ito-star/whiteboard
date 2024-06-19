/* eslint-disable camelcase */
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const got = require("got");
const Dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone"); // dependent on utc plugin
const advancedFormat = require("dayjs/plugin/advancedFormat");
const { getMailgunClient } = require("./utils");
const { getBoardInfo, getBlockInfo } = require("./hooks/utils");
const { BlockTypes } = require("./constant");

const { wrapEventFunction } = require("./sentry");

Dayjs.extend(utc);
Dayjs.extend(timezone);
Dayjs.extend(advancedFormat);

const qaDataDBPath = "/blocks/{board_id}/{block_id}/qa_data";

const callWebhook = async (data) => {
  const { webhookURL, useQAWebhook } = data;

  if (webhookURL !== "" && useQAWebhook) {
    await got.post(webhookURL, {
      json: data,
      responseType: "json",
    });
  }
};

const collectDataAndSettings = async (_, context) => {
  const { board_id, block_id } = context.params;
  const qaData = {};

  const blockSnap = await admin
    .database()
    .ref(`/blocks/${board_id}/${block_id}`)
    .once("value");
  const block = blockSnap.val();

  const boardSnap = await admin
    .database()
    .ref(`/whiteboards/${board_id}`)
    .once("value");
  const board = boardSnap.val();

  block.qa_data.forEach((item, index) => {
    qaData[`question${index + 1}`] = item.question;
    qaData[`answer${index + 1}`] = item.answer;
  });

  const result = {
    data: {
      ...getBoardInfo(board_id, board),
      ...getBlockInfo(block),
      ...qaData,
      qa_data: block.qa_data,
      timestamp: new Date().toJSON(),
    },
    settings: {
      webhookURL: block.webhookURL,
      useQAWebhook: block.useQAWebhook,
      emailBoardOwner: Object.prototype.hasOwnProperty.call(
        block,
        "qaEmailBoardOwner"
      )
        ? !!block.qaEmailBoardOwner
        : true,
    },
  };

  return result;
};

exports.onQADataUpdated = functions.database.ref(qaDataDBPath).onUpdate(
  wrapEventFunction(async (_, context) => {
    const { data, settings } = await collectDataAndSettings(_, context);

    if (data.block_type !== BlockTypes.QAForm) {
      return;
    }

    await callWebhook({
      ...data,
      webhookURL: settings.webhookURL,
      useQAWebhook: settings.useQAWebhook,
    });
  })
);

exports.emailAnswers = functions.database.ref(qaDataDBPath).onUpdate(
  wrapEventFunction(async (_, context) => {
    const { data, settings } = await collectDataAndSettings(_, context);

    if (data.block_type !== BlockTypes.QAForm) {
      return;
    }

    const templateName = "block-qa-answers";

    // When developing a template, you can set this to the version tag you are working on.
    // Once you're done, set that version tag to "active", then set this variable back
    // to "undefined".
    const templateVersion = undefined;

    const recipients = {};

    if (settings.emailBoardOwner) {
      const boardOwner = await admin.auth().getUserByEmail(data.board_owner);

      recipients[boardOwner.email] = {
        name: boardOwner.displayName,
        email: boardOwner.email,
      };
    }

    const to = Object.values(recipients).map((recipient) => {
      return `${recipient.name} <${recipient.email}>`;
    });

    if (!to.length) {
      return;
    }

    const templateVariables = {
      ...data,
      display_name: "%recipient.name%",
      whatboard_date: Dayjs(data.timestamp)
        .tz("America/Chicago")
        .format("DD/MM/YYYY hh:mm:ss A z"),
    };

    const params = {
      from: "Whatboard LLC <no-reply@mg.whatboard.app>",
      to,
      subject: `Whatboard Q & A Block Response for Block "${data.block_title}" in Board "${data.board_title}" on ${templateVariables.whatboard_date}`,
      template: templateName,
      "t:version": templateVersion,
      "t:text": "yes",
      "o:tag": ["support-form"],
      "h:X-Mailgun-Variables": JSON.stringify(templateVariables),
      "recipient-variables": JSON.stringify(recipients),
    };

    const mg = getMailgunClient();
    await mg.messages.create(functions.config().mailgun.domain, params);
  })
);
