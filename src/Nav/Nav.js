import React, { useState, useEffect } from "react";
import Button from "@material-ui/core/Button";
import MenuIcon from "@material-ui/icons/MenuOutlined";
import CloseIcon from "@material-ui/icons/CloseOutlined";
import Modal from "@material-ui/core/Modal";
import { Link } from "react-router-dom";
import ButtonLink from "../ButtonLink";
import "./Nav.scss";

export default function Nav() {
  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClickClose = () => {
    setOpen(false);
  };

  const [navClass, setNavClass] = useState("landing-nav");

  useEffect(() => {
    window.onscroll = () => {
      if (window.pageYOffset > 100) {
        setNavClass("floating-nav");
      } else {
        setNavClass("landing-nav");
      }
    };
  });

  return (
    <nav className={navClass}>
      <div className="landing-nav-left">
        <h1 className="colored">
          <Link to="/">
            <img src="/logo.svg" alt="logo" />
            <span>whatboard</span>
          </Link>
        </h1>
      </div>
      <div className="landing-nav-right">
        <div className="landing-links">
          <h1 className="price-header">
            <Link to="/security">Security</Link>
          </h1>
          <h1 className="price-header">
            <Link to="/pricing">Pricing</Link>
          </h1>

          <div className="button-container">
            <ButtonLink className="confirm-button" route="/signup">
              Get Started
            </ButtonLink>
          </div>
          <div className="button-container">
            <ButtonLink className="confirm-button login" route="/login">
              Login
            </ButtonLink>
          </div>
        </div>
        <div className="landing-menu">
          <Button onClick={handleClickOpen}>
            <MenuIcon />
          </Button>
          <Modal
            className="modal-menu"
            open={open}
            onClose={handleClickClose}
            aria-labelledby="simple-modal-title"
            aria-describedby="simple-modal-description"
          >
            <>
              <CloseIcon onClick={handleClickClose} className="close-icon" />
              <center>
                <h1>
                  <Link to="/">Home</Link>
                </h1>
                <h1>
                  <Link to="/pricing">Pricing</Link>
                </h1>
                <h1>
                  <Link to="/login">Log In</Link>
                </h1>
              </center>
            </>
          </Modal>
        </div>
      </div>
    </nav>
  );
}
