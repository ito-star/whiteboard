import React from "react";
import { createSvgIcon } from "@material-ui/core";

/**
 * Material UI "FileOpenOutlined" icon
 *
 * Remove this when any of the following happen:
 *
 * - `@material-ui/icons` updates to include it
 * - `mdi-material-ui` updates to include it
 * - We migrate to MUI v5
 *
 * @see https://github.com/mui/material-ui/blob/master/packages/mui-icons-material/lib/FileOpenOutlined.js#L15
 */
export default createSvgIcon(
  <path d="M15 22H6c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h8l6 6v6h-2V9h-5V4H6v16h9v2zm4-.34v-2.24l2.95 2.95 1.41-1.41L20.41 18h2.24v-2H17v5.66h2z" />,
  "FileOpenOutlined"
);
