import React from "react";
import hoistNonReactStatics from "hoist-non-react-statics";
import { getDisplayName } from "@material-ui/utils";
import { useModal } from "mui-modal-provider";

/**
 * A Higher Order Component for modal dialogs
 *
 * This HOC is intended primarily for class-based React Components.
 * Function Components should use the `useModal()` hook, instead.
 *
 * See: https://www.npmjs.com/package/mui-modal-provider/v/2.0.0#usage
 *
 * Do not use this for confirmation dialogs. Use either `withConfirm()`
 * or `useConfirm()` instead.
 */
const withModal = () => (Component) => {
  const WithModal = React.forwardRef((props, ref) => {
    const modal = useModal();

    return <Component ref={ref} {...props} modal={modal} />;
  });

  if (process.env.NODE_ENV !== "production") {
    WithModal.displayName = `WithModal(${getDisplayName(Component)})`;
  }

  hoistNonReactStatics(WithModal, Component);

  return WithModal;
};

export default withModal;
