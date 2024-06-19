import React from "react";
import styled, { css } from "styled-components";
import ButtonBase from "@material-ui/core/ButtonBase";
import Typography from "@material-ui/core/Typography";
import Tooltip from "@material-ui/core/Tooltip";
import { ThemeColors } from "../constant";

const canUseColor = (color) => {
  const badColors = [ThemeColors.WHITE, ThemeColors.NOCOLOR];
  return color && !badColors.includes(color);
};

export const StyledButtonbase = styled(ButtonBase)`
  && {
    ${(receivedProps) =>
      canUseColor(receivedProps.board_header_color) &&
      css`
        border: 2px solid ${receivedProps.board_header_color};
      `}
    ${(receivedProps) =>
      !canUseColor(receivedProps.board_header_color) &&
      css`
        border: 2px solid lightgrey;
      `}
  }
  &&:hover {
    && .board-title a {
      border-bottom: 2px solid rgba(0, 0, 0, 0.54);
    }
  }
`;

export const StyledBoardTitle = styled.div`
  && a {
    ${(receivedProps) =>
      canUseColor(receivedProps.board_header_color) &&
      css`
        border-bottom: 2px solid ${receivedProps.board_header_color};
      `}
    ${(receivedProps) =>
      !canUseColor(receivedProps.board_header_color) &&
      css`
        border-bottom: 2px solid rgba(0, 0, 0, 0.54);
      `}
  }
`;

const MenuItemTypography = styled(Typography)`
  width: 100%;
  height: 100%;
`;

export const MenuItemText = React.forwardRef((props, ref) => {
  const { TooltipProps = {}, tooltip: tooltipProp, children, ...other } = props;

  const tooltip = tooltipProp || TooltipProps.title;

  const content = (
    <MenuItemTypography {...other} ref={ref}>
      {children}
    </MenuItemTypography>
  );

  if (tooltip) {
    return (
      <Tooltip placement="right" title={tooltip} {...TooltipProps}>
        {content}
      </Tooltip>
    );
  }

  return content;
});
