import React from "react";
import IconButton from "@material-ui/core/IconButton";
import { Link } from "react-router-dom";
import { isExternalUrl } from "../utils";

const IconButtonLink = (props) => {
  const { route, className, children, ...other } = props;
  let component = Link;
  let componentProps = {
    to: route,
  };

  if (isExternalUrl(route)) {
    component = "a";
    componentProps = {
      href: route,
    };
  }

  return (
    <IconButton
      {...other}
      className={className}
      component={component}
      {...componentProps}
    >
      {children}
    </IconButton>
  );
};

export default IconButtonLink;
