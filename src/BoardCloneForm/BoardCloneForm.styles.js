import React from "react";
import Box from "@material-ui/core/Box";
import _ from "lodash";

export const DangerText = (props) => {
  return <Box {...props} component="strong" color="error.main" />;
};

DangerText.propTypes = _.omit(Box.propTypes, ["component", "color"]);

export const SuccessText = (props) => {
  return <Box {...props} component="strong" color="success.main" />;
};

SuccessText.propTypes = _.omit(Box.propTypes, ["component", "color"]);
