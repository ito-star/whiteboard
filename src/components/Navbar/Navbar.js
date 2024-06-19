import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import IconButton from "@material-ui/core/IconButton";
import { MenuOpenOutlined as MenuOpenIcon } from "@material-ui/icons";
import ClickAwayListener from "@material-ui/core/ClickAwayListener";

import logoHeaderImage from "../../assets/images/logo-header.png";

import {
  NavWrapper,
  NavContainer,
  NavList,
  NavListItem,
} from "./Navbar.styles";

const Navbar = () => {
  const [openNav, setOpenNav] = useState(false);
  return (
    <NavWrapper>
      <NavContainer className="container px-3 p-md-0">
        <Link to="/">
          <img src={logoHeaderImage} alt="logo" />
        </Link>

        <ClickAwayListener
          onClickAway={() => {
            setOpenNav(false);
          }}
        >
          <div>
            <IconButton
              onClick={() => setOpenNav(true)}
              className="d-block d-lg-none"
            >
              <MenuOpenIcon fontSize="large" htmlColor="white" />
            </IconButton>
            <NavList open={openNav}>
              <NavListItem>
                <NavLink to="/security">Security</NavLink>
              </NavListItem>
              <NavListItem>
                <a
                  href="https://chrome.google.com/webstore/detail/whatboard/npaccllkphikfkdbmedailkemffjffgg"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Chrome Extension
                </a>
              </NavListItem>
              <NavListItem>
                <NavLink to="/pricing">Pricing</NavLink>
              </NavListItem>
              <NavListItem rounded>
                <NavLink to="/login">LOGIN</NavLink>
              </NavListItem>
              <NavListItem rounded>
                <NavLink to="/signup">SIGN UP</NavLink>
              </NavListItem>
            </NavList>
          </div>
        </ClickAwayListener>
      </NavContainer>
    </NavWrapper>
  );
};

export default Navbar;
