const functions = require("firebase-functions");
const authenticate = require("../api/authenticate");
const errorHandler = require("../api/error-handler");
const { access } = require("../access");
const { blockTypesInfo } = require("../constant");
const { wrapHttpFunction } = require("../sentry");

exports.getBoardCreateFields = functions.https.onRequest(
  wrapHttpFunction(async (req, res) => {
    try {
      const user = await authenticate(req);
      const fields = [
        "board_name",
        "board_header_color",
        "boardBodyColor",
        "isArchived",
        "pinned",
      ];

      if (await access.canMakeBoardsPublic(user)) {
        fields.push("isPublic");
        fields.push("friendly_url");
      }

      res.json(fields);
    } catch (e) {
      errorHandler(e, res);
    }
  })
);

exports.getAllowedBlockTypes = functions.https.onRequest(
  wrapHttpFunction(async (req, res) => {
    try {
      const user = await authenticate(req);
      const blockTypes = Array.from(Object.keys(blockTypesInfo));
      const allowedBlockTypes = blockTypes.filter((blockType) => {
        return access.canCreateBlocksOfType(blockType, user);
      });

      res.json(allowedBlockTypes);
    } catch (e) {
      errorHandler(e, res);
    }
  })
);
