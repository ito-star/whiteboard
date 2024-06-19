import React from "react";
import { createSvgIcon } from "@material-ui/core";

/**
 * Material UI "Html" icon
 *
 * Remove this when any of the following happen:
 *
 * - `@material-ui/icons` updates to include it
 * - `mdi-material-ui` updates to include it
 * - We migrate to MUI v5
 *
 * @see https://github.com/mui/material-ui/blob/master/packages/mui-icons-material/lib/Html.js#L15
 */
export default createSvgIcon(
  <path d="M3.5 9H5v6H3.5v-2.5h-2V15H0V9h1.5v2h2V9zm14 0H13c-.55 0-1 .45-1 1v5h1.5v-4.5h1V14H16v-3.51h1V15h1.5v-5c0-.55-.45-1-1-1zM11 9H6v1.5h1.75V15h1.5v-4.5H11V9zm13 6v-1.5h-2.5V9H20v6h4z" />,
  "Html"
);
