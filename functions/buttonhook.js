const got = require("got");

const { getBoardInfo, getBlockInfo } = require("./hooks/utils");

/**
 * Call Button Block Webhook
 */
const buttonWebhook = async (boardId, board, block, button, userEmail) => {
  const data = {
    ...getBoardInfo(boardId, board),
    ...getBlockInfo(block),
    webhookURL: block.webhookURL,
    useButtonWebhook: block.useButtonWebhook,
    // eslint-disable-next-line camelcase
    button_type: button.type,
    // eslint-disable-next-line camelcase
    button_title: button.text,
    // eslint-disable-next-line camelcase
    button_link: button.url,
    // eslint-disable-next-line camelcase
    user_who_clicked: userEmail,
    timestamp: new Date(),
  };

  if (data.webhookURL !== "" && data.useButtonWebhook) {
    await got.post(data.webhookURL, {
      json: data,
      responseType: "json",
    });
  }
};

module.exports = buttonWebhook;
