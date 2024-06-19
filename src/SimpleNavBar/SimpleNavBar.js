import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import clsx from "clsx";
import UserMenu from "../User/UserMenu";

import "./SimpleNavBar.scss";

const SimpleNavBar = React.forwardRef(function SimpleNavBar(props, ref) {
  const {
    className,
    beforeLogo,
    afterLogo,
    beforeUserMenu,
    afterUserMenu,
  } = props;

  return (
    <nav ref={ref} className={clsx("simple-nav-bar", className)}>
      <div className="simple-nav-bar-left">
        {beforeLogo}
        <h1 className="colored">
          <Link to="/">
            <img src="/logo.svg" alt="logo" /> whatboard
          </Link>
        </h1>
        {afterLogo}
      </div>
      <div className="simple-nav-bar-right">
        {beforeUserMenu}
        <UserMenu />
        {afterUserMenu}
      </div>
    </nav>
  );
});

SimpleNavBar.defaultProps = {
  className: "",
  beforeLogo: null,
  afterLogo: null,
  beforeUserMenu: null,
  afterUserMenu: null,
};

SimpleNavBar.propTypes = {
  className: PropTypes.string,
  beforeLogo: PropTypes.node,
  afterLogo: PropTypes.node,
  beforeUserMenu: PropTypes.node,
  afterUserMenu: PropTypes.node,
};

export default SimpleNavBar;
