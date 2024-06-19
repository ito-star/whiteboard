import React from "react";
import { Link as RouterLink } from "react-router-dom";
import MenuItem from "@material-ui/core/MenuItem";

const LinkMenuItem = (props) => {
  const { to, children, ...other } = props;

  const renderLink = React.useMemo(
    () =>
      React.forwardRef((itemProps, ref) => (
        <RouterLink to={to} ref={ref} {...itemProps} />
      )),
    [to]
  );

  return (
    <li>
      <MenuItem {...other} button component={renderLink}>
        {children}
      </MenuItem>
    </li>
  );
};

export default LinkMenuItem;
