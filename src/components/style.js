import React from "react";
import styled from "styled-components";
import { withStyles } from "@material-ui/core/styles";
import Switch from "@material-ui/core/Switch";
import Checkbox from "@material-ui/core/Checkbox";

const BlueCheckbox = withStyles({
  root: {
    color: "#2c387e",
    borderRadius: "4px",
    marginLeft: "10px",
    "&$checked": {
      color: "#2c387e",
    },
  },
  checked: {},
})((props) => <Checkbox color="default" {...props} />);

export const ColorItem = styled.div`
  background-color: ${(props) => props.color};
`;

export const CustomSwitch = withStyles({
  switchBase: {
    color: "white",
    "&$checked": {
      color: "white",
    },
    "&$checked + $track": {
      backgroundColor: "#d5d5d5",
    },
  },
  checked: {},
  track: {},
})(Switch);

export default BlueCheckbox;
