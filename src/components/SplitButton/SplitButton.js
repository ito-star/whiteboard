import React, { forwardRef, useState } from "react";
import PropTypes from "prop-types";
import classNames from "clsx";
import { Button, SvgIcon, Menu } from "@material-ui/core";
import { withStyles } from "@material-ui/core/styles";

/**
 * Based on
 * https://github.com/alexplumb/material-ui-split-button/blob/fe5859dbfc3b885bcfd2463f11016e418410f3ec/src/components/index.jsx
 *
 * - Converted to Function Component
 * - Fixed usage of deprecated `theme.spacing.unit`
 * - Made icon for menu trigger customizable
 * - Made button components customizable
 */

const styles = (theme) => ({
  root: {
    borderRadius: theme.spacing(0.5),
  },
  rootContained: {
    boxShadow: theme.shadows[4],
  },
  button: {
    flex: "1 0 auto",
    boxShadow: "none",
  },
  buttonPositionLeft: {
    borderLeftWidth: 0,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    "&:hover": {
      borderLeftWidth: 0,
    },
  },
  buttonPositionRight: {
    borderRightWidth: 0,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    "&:hover": {
      borderRightWidth: 0,
    },
  },
  menuPositionLeft: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  menuPositionRight: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  menuButton: {
    width: theme.spacing(4),
    minWidth: theme.spacing(4),
    paddingLeft: 0,
    paddingRight: 0,
    flex: "none",
    boxShadow: "none",
  },
  buttonFullWidth: {
    width: "100%",
    display: "flex",
  },
});

const MuiSplitButton = forwardRef(function MuiSplitButton(props, ref) {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleOpen = (e) => {
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const menuButton = () => {
    const {
      ButtonComponent: ButtonComponentProp,
      MenuButtonComponentProp,
      MenuButtonProps = {},
      classes,
      position = "right",
      variant,
      color,
      menuButtonIcon = null,
    } = props;

    const { className = "", ...restProps } = MenuButtonProps;
    const MenuButtonComponent =
      MenuButtonComponentProp || ButtonComponentProp || Button;

    return (
      <MenuButtonComponent
        aria-owns={anchorEl ? "material-ui-split-button-menu" : undefined}
        aria-haspopup="true"
        onClick={handleOpen}
        variant={variant}
        color={color}
        {...restProps}
        className={classNames(
          position === "left"
            ? classes.menuPositionLeft
            : classes.menuPositionRight,
          classes.menuButton,
          className
        )}
      >
        {menuButtonIcon || (
          <SvgIcon>
            <path d="M7 10l5 5 5-5z" />
          </SvgIcon>
        )}
      </MenuButtonComponent>
    );
  };

  const {
    ButtonComponent: ButtonComponentProp,
    classes,
    className = "",
    fullWidth = false,
    children,
    position = "right",
    variant,
    MenuButtonProps,
    renderMenu,
    MenuProps,
    menuButtonIcon,
    MenuButtonComponent,
    ...restProps
  } = props;

  const ButtonComponent = ButtonComponentProp || Button;

  return (
    <div
      ref={ref}
      className={classNames(
        classes.root,
        variant === "contained" && classes.rootContained,
        fullWidth && classes.buttonFullWidth
      )}
    >
      {position === "left" && menuButton()}

      <ButtonComponent
        variant={variant}
        {...restProps}
        className={classNames(
          position === "left"
            ? classes.buttonPositionLeft
            : classes.buttonPositionRight,
          classes.button,
          className
        )}
      >
        {children}
      </ButtonComponent>

      {position === "right" && menuButton()}

      <Menu
        id="material-ui-split-button-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        getContentAnchorEl={null}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        anchorOrigin={{
          horizontal: "right",
          vertical: "bottom",
        }}
        {...MenuProps}
      >
        {renderMenu({
          handleClose,
        })}
      </Menu>
    </div>
  );
});

MuiSplitButton.propTypes = {
  ButtonComponent: PropTypes.elementType,
  position: PropTypes.oneOf(["left", "right"]),
  classes: PropTypes.shape({}).isRequired,
  MenuButtonComponent: PropTypes.elementType,
  MenuButtonProps: PropTypes.shape({}),
  MenuProps: PropTypes.shape({}),
  menuButtonIcon: PropTypes.node,
  variant: PropTypes.oneOf(["text", "outlined", "contained"]),
  color: PropTypes.oneOf(["default", "inherit", "primary", "secondary"]),
  className: PropTypes.string,
  fullWidth: PropTypes.bool,
  children: PropTypes.node.isRequired,
  renderMenu: PropTypes.func.isRequired,
};

MuiSplitButton.defaultProps = {
  ButtonComponent: null,
  position: "right",
  MenuButtonComponent: null,
  MenuButtonProps: {},
  MenuProps: {},
  variant: "text",
  color: "default",
  className: "",
  fullWidth: false,
  menuButtonIcon: null,
};

export default withStyles(styles, { name: "MuiSplitButton" })(MuiSplitButton);
