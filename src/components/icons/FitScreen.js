import React from "react";
import { createSvgIcon } from "@material-ui/core";

/**
 * Material UI "FitScreen" icon
 *
 * Remove this when any of the following happen:
 *
 * - `@material-ui/icons` updates to include it
 * - `mdi-material-ui` updates to include it
 * - We migrate to MUI v5
 *
 * @see https://github.com/mui-org/material-ui/blob/5daaf9be5115b1cb777fb4cf3d9125baddfe5720/packages/mui-icons-material/lib/FitScreen.js#L15
 */
export default createSvgIcon(
  <path d="M17 4h3c1.1 0 2 .9 2 2v2h-2V6h-3V4zM4 8V6h3V4H4c-1.1 0-2 .9-2 2v2h2zm16 8v2h-3v2h3c1.1 0 2-.9 2-2v-2h-2zM7 18H4v-2H2v2c0 1.1.9 2 2 2h3v-2zM18 8H6v8h12V8z" />,
  "FitScreen"
);
