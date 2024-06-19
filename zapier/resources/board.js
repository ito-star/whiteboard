const config = require("../config");
const { makeColorChoices, boardColors } = require("./utils");

const colorChoices = makeColorChoices(boardColors);

const fields = {
  id: { key: "id", label: "Board ID", type: "string" },
  board_name: { key: "board_name", label: "Board Name", type: "string" },
  board_members: {
    key: "board_members",
    label: "Board Members",
    type: "string",
    list: true,
  },
  board_header_color: {
    key: "board_header_color",
    label: "Board Header Color",
    type: "string",
    choices: colorChoices,
  },
  boardBodyColor: {
    key: "boardBodyColor",
    label: "Board Body Color",
    type: "string",
    choices: colorChoices,
  },
  date_created: {
    key: "date_created",
    label: "Date Created",
    type: "datetime",
  },
  unique_url: {
    key: "unique_url",
    label: "Public URL Invitation Code",
    type: "string",
  },
  friendly_url: {
    key: "friendly_url",
    label: "Public URL Friendly Code",
    type: "string",
    inputFormat: "https://whatboard.app/b/{{input}}",
    helpText: "Enter a value between 4 and 23 characters",
  },
  boardUrl: { key: "boardUrl", label: "Board URL", type: "string" },
  boardPublicUrl: {
    key: "boardPublicUrl",
    label: "Board Public URL",
    type: "string",
  },
  boardPublicFriendlyUrl: {
    key: "boardPublicFriendlyUrl",
    label: "Board Friendly Public URL",
  },
  isPublic: {
    key: "isPublic",
    label: "Publically Accessible",
    type: "boolean",
  },
  isArchived: {
    key: "isArchived",
    label: "Archived",
    type: "boolean",
  },
  pinned: {
    key: "pinned",
    label: "Pinned",
    type: "boolean",
  },
};

module.exports = {
  key: "board",
  noun: "Board",

  get: {
    display: {
      label: "Get a Board",
      description: "Gets a Board by its ID",
    },
    operation: {
      inputFields: [{ ...fields.id, required: true }],
      perform: async (z, bundle) => {
        const response = await z.request({
          url: `${config.WHATBOARD_API_URL}/boards/${bundle.inputData.id}`,
        });

        return response.data;
      },
    },
  },

  list: {
    display: {
      label: "List Boards",
      hidden: true,
    },
    operation: {
      canPaginate: true,
      perform: async (z, bundle) => {
        let cursor;

        if (bundle.meta.page) {
          cursor = await z.cursor.get();
        }

        const response = await z.request({
          url: `${config.WHATBOARD_API_URL}/boards`,
          params: {
            orderBy: "date_created",
            dir: "desc",
            pageToken: cursor,
          },
        });

        const { result, nextPageToken } = response.data;

        if (nextPageToken) {
          await z.cursor.set(nextPageToken);
        }

        return result;
      },
    },
  },

  create: {
    display: {
      label: "Create Board",
      description: "Creates a new Board",
      important: true,
    },
    operation: {
      inputFields: [
        { ...fields.board_name, required: true },
        async (z) => {
          const allowedFields = (
            await z.request(
              `${config.WHATBOARD_URL}/zapier-getBoardCreateFields`
            )
          ).data;

          const createFields = {};
          const staticFields = [
            "board_name",
            "board_header_color",
            "boardBodyColor",
            "isArchived",
            "pinned",
          ];

          for (const field of allowedFields) {
            if (!staticFields.includes(field)) {
              const createField = fields[field];
              createFields[field] = createField;
            }
          }

          return [createFields.isPublic, createFields.friendly_url].filter(
            Boolean
          );
        },
        { ...fields.board_header_color },
        { ...fields.boardBodyColor },
        { ...fields.isArchived },
        { ...fields.pinned },
      ],
      perform: async (z, bundle) => {
        const newBoard = {
          board_name: bundle.inputData.board_name,
          board_header_color: bundle.inputData.board_header_color,
          boardBodyColor: bundle.inputData.boardBodyColor,
          isPublic: bundle.inputData.isPublic,
          friendly_url: bundle.inputData.friendly_url,
          isArchived: bundle.inputData.isArchived,
          pinned: bundle.inputData.pinned,
        };

        const board = (
          await z.request({
            method: "POST",
            url: `${config.WHATBOARD_API_URL}/boards`,
            json: newBoard,
          })
        ).data;

        return board;
      },
    },
  },

  search: {
    display: {
      label: "Find a Board by Name",
      description:
        "Search for a Board whose name matches exactly with the one specified. The first match returned will be used.",
      important: true,
    },
    operation: {
      inputFields: [{ ...fields.board_name, required: true }],
      perform: async (z, bundle) => {
        const response = await z.request({
          url: `${config.WHATBOARD_API_URL}/boards`,
          params: {
            orderBy: "board_name",
            equalTo: bundle.inputData.board_name,
          },
        });

        return response.data.result;
      },
    },
  },

  sample: {
    id: "abc123jrgseifjesufdskfsn",
    board_members: ["john<>doe@email<>com"],
    board_header_color: "#FFFFFF",
    board_name: "My Board",
    date_created: "2021-03-10T03:53:17.522Z",
    unique_url: "00000000-0000-0000-0000-000000000000",
    friendly_url: "sample",
    boardUrl: "https://whatboard.app/board/abc123jrgseifjesufdskfsn",
    boardPublicUrl:
      "https://whatboard.app/readonlyboard/-abc123jrgseifjesufdskfsn?invitation=00000000-0000-0000-0000-000000000000",
    boardPublicFriendlyUrl: "https://whatboard.app/b/sample",
    isPublic: true,
  },

  outputFields: Object.values(fields),
};
