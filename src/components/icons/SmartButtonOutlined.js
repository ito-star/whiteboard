import React from "react";
import { createSvgIcon } from "@material-ui/core";

/**
 * Material UI "SmartButtonOutlined" icon
 *
 * Remove this when any of the following happen:
 *
 * - `@material-ui/icons` updates to include it
 * - `mdi-material-ui` updates to include it
 * - We migrate to MUI v5
 *
 * @see https://github.com/mui/material-ui/blob/master/packages/mui-icons-material/lib/SmartButtonOutlined.js#L15
 */
export default createSvgIcon(
  <path d="M22 9v6c0 1.1-.9 2-2 2h-1v-2h1V9H4v6h6v2H4c-1.1 0-2-.9-2-2V9c0-1.1.9-2 2-2h16c1.1 0 2 .9 2 2zm-7.5 10 1.09-2.41L18 15.5l-2.41-1.09L14.5 12l-1.09 2.41L11 15.5l2.41 1.09L14.5 19zm2.5-5 .62-1.38L19 12l-1.38-.62L17 10l-.62 1.38L15 12l1.38.62L17 14zm-2.5 5 1.09-2.41L18 15.5l-2.41-1.09L14.5 12l-1.09 2.41L11 15.5l2.41 1.09L14.5 19zm2.5-5 .62-1.38L19 12l-1.38-.62L17 10l-.62 1.38L15 12l1.38.62L17 14z" />,
  "SmartButtonOutlined"
);
