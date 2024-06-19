import React from "react";
import { createMuiTheme } from "@material-ui/core/styles";
import ExpandMoreIcon from "@material-ui/icons/ExpandMoreOutlined";

// A custom theme for this app
const theme = createMuiTheme({
  palette: {
    primary: {
      main: "#2c387e",
    },
    error: {
      main: "#dc3545",
    },
  },
  typography: {
    fontFamily: `Lato, Helvetica, Arial, sans-serif`,
    fontSize: 14,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
  },
  props: {
    MuiSelect: {
      IconComponent: ExpandMoreIcon,
    },
    MuiAccordionSummary: {
      expandIcon: <ExpandMoreIcon />,
    },
    MuiTooltip: {
      arrow: true,
      // This becomes the default in MUI v5
      // https://mui.com/guides/migration-v4/#tooltip
      interactive: true,
    },
    MuiCheckbox: {
      // This becomes the default in MUI v5
      // https://mui.com/guides/migration-v4/#checkbox
      color: "primary",
    },
    MuiRadio: {
      // This becomes the default in MUI v5
      // https://mui.com/guides/migration-v4/#radio
      color: "primary",
    },
  },
});

export default theme;
