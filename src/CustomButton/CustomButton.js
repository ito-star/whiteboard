import React from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import _omit from "lodash/omit";
import Button from "@material-ui/core/Button";
import LinkedInIcon from "@material-ui/icons/LinkedIn";
import FacebookIcon from "@material-ui/icons/Facebook";
import YouTubeIcon from "@material-ui/icons/YouTube";
import TwitterIcon from "@material-ui/icons/Twitter";
import { customButtonType } from "../constant";

import "./CustomButton.scss";

const CustomButton = React.forwardRef(function CustomButton(
  { button, ...muiButtonProps },
  ref
) {
  const getStartIcon = () => {
    switch (button.type) {
      case customButtonType.LinkedIn:
        return <LinkedInIcon />;
      case customButtonType.Facebook:
        return <FacebookIcon />;
      case customButtonType.Youtube:
        return <YouTubeIcon />;
      case customButtonType.Twitter:
        return <TwitterIcon />;
      default:
        return null;
    }
  };

  return (
    <>
      <Button
        {...muiButtonProps}
        ref={ref}
        className={clsx("custom-button", muiButtonProps.className)}
        variant="contained"
        startIcon={getStartIcon()}
        style={{
          color: button.color,
          backgroundColor: button.backgroundColor,
        }}
      >
        {button.text}
      </Button>
    </>
  );
});

CustomButton.propTypes = {
  button: PropTypes.shape({}).isRequired,
  ..._omit(Button.propTypes, ["variant", "startIcon"]),
};

export default CustomButton;
