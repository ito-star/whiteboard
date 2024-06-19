import React from "react";
import PropTypes from "prop-types";
import {
  DialogTitle as MuiDialogTitle,
  DialogActions as MuiDialogActions,
  IconButton,
  Typography,
} from "@material-ui/core";
import CloseIcon from "@material-ui/icons/CloseOutlined";
import styled from "styled-components";

const DialogTitleRoot = styled(MuiDialogTitle)`
  display: flex;
  align-items: center;
`;

const DialogTitleText = styled(Typography)`
  flex: 1 1 auto;
`;

const CloseButtonRoot = styled(IconButton)`
  flex: 0 0 auto;
`;

const CloseButton = React.forwardRef(function CloseButton(props, ref) {
  return (
    <CloseButtonRoot {...props} ref={ref}>
      <CloseIcon />
    </CloseButtonRoot>
  );
});

// eslint-disable-next-line import/prefer-default-export
export const DialogTitle = React.forwardRef(function DialogTitle(props, ref) {
  const { children, CloseButtonProps, ...other } = props;

  return (
    <DialogTitleRoot ref={ref} {...other} disableTypography>
      <DialogTitleText component="h2" variant="h6">
        {children}
      </DialogTitleText>
      <CloseButton {...CloseButtonProps} type="button" />
    </DialogTitleRoot>
  );
});

DialogTitle.defaultProps = {
  CloseButtonProps: {},
};

DialogTitle.propTypes = {
  CloseButtonProps: PropTypes.shape(IconButton.propTypes),
};

export const DialogActions = styled(MuiDialogActions)`
  min-height: 60px;
  padding-left: 24px !important;
  padding-right: 24px !important;
`;
