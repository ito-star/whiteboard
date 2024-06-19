import React from "react";
import Button from "@material-ui/core/Button";
import { Link, NavLink } from "react-router-dom";
import { isExternalUrl } from "../utils";

const ButtonLink = React.forwardRef((props, ref) => {
  const { route, className, children, navLink, ...other } = props;
  let component = Link;

  if (navLink) {
    component = NavLink;
  }

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
    <Button
      {...other}
      className={className}
      component={component}
      {...componentProps}
      ref={ref}
    >
      {children}
    </Button>
  );
});

export default ButtonLink;
