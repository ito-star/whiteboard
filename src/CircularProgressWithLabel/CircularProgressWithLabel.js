import React from "react";
import PropTypes from "prop-types";
import CircularProgress from "@material-ui/core/CircularProgress";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";

const CircularProgressWithLabel = React.forwardRef(
  function CircularProgressWithLabel(props, ref) {
    const { TypographyProps: inTypographyProps = {}, ...ProgressProps } = props;
    const { value } = ProgressProps;

    const TypographyProps = {
      variant: "caption",
      component: "div",
      color: "textSecondary",
      ...inTypographyProps,
    };

    return (
      <Box position="relative" display="inline-flex">
        <CircularProgress variant="static" {...ProgressProps} ref={ref} />
        <Box
          top={0}
          left={0}
          bottom={0}
          right={0}
          position="absolute"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Typography {...TypographyProps}>{`${Math.round(
            value
          )}%`}</Typography>
        </Box>
      </Box>
    );
  }
);

CircularProgressWithLabel.propTypes = {
  ...CircularProgress.propTypes,
  // eslint-disable-next-line react/require-default-props
  TypographyProps: PropTypes.shape(Typography.propTypes),
};

export default CircularProgressWithLabel;
