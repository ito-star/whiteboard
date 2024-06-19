import React from "react";
import { createSvgIcon } from "@material-ui/core";

/**
 * Material UI "CalendarViewMonth" icon
 *
 * Remove this when any of the following happen:
 *
 * - `@material-ui/icons` updates to include it
 * - `mdi-material-ui` updates to include it
 * - We migrate to MUI v5
 *
 * @see https://github.com/mui-org/material-ui/blob/5daaf9be5115b1cb777fb4cf3d9125baddfe5720/packages/mui-icons-material/lib/CalendarViewMonth.js#L15
 */
export default createSvgIcon(
  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM8 11H4V6h4v5zm6 0h-4V6h4v5zm6 0h-4V6h4v5zM8 18H4v-5h4v5zm6 0h-4v-5h4v5zm6 0h-4v-5h4v5z" />,
  "CalendarViewMonth"
);
