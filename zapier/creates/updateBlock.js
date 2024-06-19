const config = require("../config");
const {
  BlockTypes,
  blockGlobalFieldsFactory,
  blockTypeFieldFactory,
  blockTypeFieldsFactory,
  convertInputChildrenToData,
  convertNestedFieldsToData,
} = require("../resources/block");

module.exports = {
  key: "blockUpdate",
  noun: "Block",
  display: {
    label: "Update a Block",
    description: "Updates an existing Block",
  },
  operation: {
    resource: "block",
    inputFields: [
      ...blockGlobalFieldsFactory("update"),
      blockTypeFieldFactory(),
      blockTypeFieldsFactory("update"),
    ],
    perform: async (z, bundle) => {
      const { updateMode = "replace", ...otherInputData } = bundle.inputData;
      let existingBlock;
      const blockUrl = `${config.WHATBOARD_API_URL}/blocks/${bundle.inputData.board_id}/${bundle.inputData.id}`;

      if (updateMode === "merge") {
        existingBlock = (
          await z.request({
            url: blockUrl,
          })
        ).data;
      }

      const block = {
        ...otherInputData,
      };

      if (block.type === BlockTypes.Checklist) {
        delete block.dataId;
        delete block.text;
        delete block.checked;
        delete block.data;

        const { data: bundleData } = bundle.inputData;
        const newData = (bundleData || []).map((item) => {
          const { dataId, ...other } = item;
          return {
            id: dataId,
            ...other,
          };
        });

        if (updateMode === "replace") {
          block.data = newData;
        } else if (updateMode === "merge" && existingBlock) {
          const hasIds = newData.filter((item) => {
            return !!item.id;
          });
          const noIds = newData.filter((item) => {
            return !item.id;
          });

          block.data = (existingBlock.data || []).map((item) => {
            const newItem = hasIds.find((i) => i.id === item.id);

            return {
              ...item,
              ...newItem,
            };
          });

          block.data = block.data.concat(noIds);
        }
      }

      if (block.type === BlockTypes.QAForm) {
        delete block.qaId;
        delete block.question;
        delete block.answer;
        delete block.qa_data;

        const { qa_data: bundleQaData } = bundle.inputData;
        const newQaData = (bundleQaData || []).map((item) => {
          const { qaId, ...other } = item;
          return {
            id: qaId,
            ...other,
          };
        });

        if (updateMode === "replace") {
          block.qa_data = newQaData;
        } else if (updateMode === "merge" && existingBlock) {
          const hasIds = newQaData.filter((item) => {
            return !!item.id;
          });
          const noIds = newQaData.filter((item) => {
            return !item.id;
          });

          block.qa_data = (existingBlock.qa_data || []).map((item) => {
            const newItem = hasIds.find((i) => i.id === item.id);

            return {
              ...item,
              ...newItem,
            };
          });

          block.qa_data = block.qa_data.concat(noIds);
        }
      }

      if (block.type === BlockTypes.Buttons) {
        delete block["buttons[]id"];
        delete block["buttons[]type"];
        delete block["buttons[]color"];
        delete block["buttons[]backgroundColor"];
        delete block["buttons[]text"];
        delete block["buttons[]url"];
        delete block.buttons;

        const { buttons: bundleButtons } = bundle.inputData;
        const newButtons = convertInputChildrenToData(bundleButtons, "buttons");

        if (updateMode === "replace") {
          block.buttons = newButtons;
        } else if (updateMode === "merge" && existingBlock) {
          const hasIds = newButtons.filter((item) => {
            return !!item.id;
          });
          const noIds = newButtons.filter((item) => {
            return !item.id;
          });

          block.buttons = (existingBlock.buttons || []).map((item) => {
            const newItem = hasIds.find((i) => i.id === item.id);

            return {
              ...item,
              ...newItem,
            };
          });

          block.buttons = block.buttons.concat(noIds);
        }
      }

      if (block.type === BlockTypes.FileRequest) {
        delete block.fileRequestSettings__note;
        block.fileRequestSettings = convertNestedFieldsToData(
          bundle.inputData,
          "fileRequestSettings"
        );
      }

      const response = await z.request({
        method: "PATCH",
        url: blockUrl,
        json: block,
      });

      return response.data;
    },
  },
};
