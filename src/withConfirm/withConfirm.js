import React from "react";
import hoistNonReactStatics from "hoist-non-react-statics";
import { getDisplayName } from "@material-ui/utils";
import { useConfirm } from "material-ui-confirm";

/**
 * An Higher Order Component for confirmation dialogs
 *
 * This HOC is intended primarily for class-based React Components.
 * Function Components should use the `useConfirm()` hook, instead.
 *
 * See: https://www.npmjs.com/package/material-ui-confirm/v/2.1.1#usage
 */
const withConfirm = () => (Component) => {
  const WithConfirm = React.forwardRef((props, ref) => {
    const confirm = useConfirm();

    return <Component ref={ref} {...props} confirm={confirm} />;
  });

  if (process.env.NODE_ENV !== "production") {
    WithConfirm.displayName = `WithConfirm(${getDisplayName(Component)})`;
  }

  hoistNonReactStatics(WithConfirm, Component);

  return WithConfirm;
};

export default withConfirm;
