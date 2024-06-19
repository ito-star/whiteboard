import React from "react";
import { Link } from "react-router-dom";

const MdxLink = (props) => {
  const { href, children, ...other } = props;

  const { origin } = window.location;
  const whatboard = /^https?:\/\/(?:www\.)?whatboard\.(?:io|app)/i;
  const uriScheme = /^[A-Za-z][A-Za-z0-9.+-]*:/;

  let isExternal = false;

  if (
    !href.startsWith(origin) &&
    !whatboard.test(href) &&
    uriScheme.test(href)
  ) {
    isExternal = true;
  }

  if (isExternal) {
    return (
      <a {...other} href={href}>
        {children}
      </a>
    );
  }
  let to = href.replace(origin, "").replace(whatboard, "");

  if (to === "") {
    to = "/";
  }

  return (
    <Link {...other} to={to}>
      {children}
    </Link>
  );
};

export default MdxLink;
