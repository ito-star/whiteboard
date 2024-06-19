import React from "react";
import PropTypes from "prop-types";
import MenuItem from "@material-ui/core/MenuItem";
import AuthCheck from "../auth/AuthCheck";

/**
 * Material UI's Menu component really doesn't like it when its children
 * are anything other than MenuItem components. This component allows us
 * to satisfy that requirement while still being able to restrict access
 * using the AuthCheck component.
 */
const RestrictedMenuItem = React.forwardRef(function RestrictedMenuItem(
  props,
  ref
) {
  const { AuthCheckProps = {}, children, ...other } = props;

  return (
    <AuthCheck {...AuthCheckProps}>
      <MenuItem {...other} ref={ref}>
        {children}
      </MenuItem>
    </AuthCheck>
  );
});

RestrictedMenuItem.propTypes = {
  ...MenuItem.propTypes,
  // eslint-disable-next-line react/require-default-props
  AuthCheckProps: PropTypes.shape(AuthCheck.propTypes),
};

export default RestrictedMenuItem;
