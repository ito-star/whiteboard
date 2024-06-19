/* eslint-disable react/require-default-props */
import * as React from "react";
import PropTypes from "prop-types";
import { useTheme, Box } from "@material-ui/core";
import { createUnarySpacing } from "@material-ui/system/spacing";
import { handleBreakpoints } from "@material-ui/system/breakpoints";
import { deepmerge } from "@material-ui/utils";
import styled from "styled-components";
import getValue from "./getValue";
import { resolveBreakpointValues } from "./resolveBreakpointValues";

/**
 * Return an array with the separator React element interspersed between
 * each React node of the input children.
 *
 * > joinChildren([1,2,3], 0)
 * [1,0,2,0,3]
 */
function joinChildren(children, separator) {
  const childrenArray = React.Children.toArray(children).filter(Boolean);

  return childrenArray.reduce((output, child, index) => {
    output.push(child);

    if (index < childrenArray.length - 1) {
      // eslint-disable-next-line react/no-array-index-key
      output.push(React.cloneElement(separator, { key: `separator-${index}` }));
    }

    return output;
  }, []);
}

const getSideFromDirection = (direction) => {
  return {
    row: "Left",
    "row-reverse": "Right",
    column: "Top",
    "column-reverse": "Bottom",
  }[direction];
};

export const style = ({ ownerState, theme }) => {
  let styles = {
    display: "flex",
    ...handleBreakpoints(
      { theme },
      resolveBreakpointValues({
        values: ownerState.direction,
        breakpoints: theme.breakpoints.values,
      }),
      (propValue) => ({
        flexDirection: propValue,
      })
    ),
  };

  if (ownerState.spacing) {
    const transformer = createUnarySpacing(theme);

    const base = Object.keys(theme.breakpoints.values).reduce(
      (acc, breakpoint) => {
        if (
          ownerState.spacing[breakpoint] != null ||
          ownerState.direction[breakpoint] != null
        ) {
          acc[breakpoint] = true;
        }
        return acc;
      },
      {}
    );

    const directionValues = resolveBreakpointValues({
      values: ownerState.direction,
      base,
    });

    const spacingValues = resolveBreakpointValues({
      values: ownerState.spacing,
      base,
    });

    const styleFromPropValue = (propValue, breakpoint) => {
      return {
        "& > :not(style) + :not(style)": {
          margin: 0,
          [`margin${getSideFromDirection(
            breakpoint ? directionValues[breakpoint] : ownerState.direction
          )}`]: getValue(transformer, propValue),
        },
      };
    };
    styles = deepmerge(
      styles,
      handleBreakpoints({ theme }, spacingValues, styleFromPropValue)
    );
  }

  return styles;
};

const StackRoot = styled(Box).withConfig({
  shouldForwardProp: (prop) => !["ownerState", "theme"].includes(prop),
})(style);

/**
 * This is an attempt to essentially backport MUI v5's Stack component
 *
 * @see https://mui.com/components/stack/
 */
const Stack = React.forwardRef(function Stack(props, ref) {
  const {
    component = "div",
    direction = "column",
    spacing = 0,
    divider,
    children,
    ...other
  } = props;
  const ownerState = {
    direction,
    spacing,
  };
  const theme = useTheme();

  return (
    <StackRoot
      component={component}
      ownerState={ownerState}
      theme={theme}
      ref={ref}
      {...other}
    >
      {divider ? joinChildren(children, divider) : children}
    </StackRoot>
  );
});

Stack.propTypes = {
  ...Box.propTypes,
  /**
   * Defines the `flex-direction` style property.
   * It is applied for all screen sizes.
   * @default 'column'
   */
  direction: PropTypes.oneOfType([
    PropTypes.oneOf(["column-reverse", "column", "row-reverse", "row"]),
    PropTypes.arrayOf(
      PropTypes.oneOf(["column-reverse", "column", "row-reverse", "row"])
    ),
    PropTypes.object,
  ]),
  /**
   * Add an element between each child.
   */
  divider: PropTypes.node,
  /**
   * Defines the space between immediate children.
   * @default 0
   */
  spacing: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    ),
    PropTypes.number,
    PropTypes.object,
    PropTypes.string,
  ]),
};

export default Stack;
