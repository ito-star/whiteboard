const express = require("express");
const boards = require("./boards");
const blocks = require("./blocks");

const apiv1 = express.Router();

apiv1.use("/boards", boards);
apiv1.use("/blocks", blocks);

module.exports = apiv1;
