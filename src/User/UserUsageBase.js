/* eslint-disable react/require-default-props */
import React from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import LinearProgress from "@material-ui/core/LinearProgress";
import Typography from "@material-ui/core/Typography";
import Tooltip from "@material-ui/core/Tooltip";
import HelpIcon from "@material-ui/icons/HelpOutlineOutlined";
import { makeStyles } from "@material-ui/core/styles";
import { darken, lighten } from "@material-ui/core/styles/colorManipulator";

import UpgradeOffer from "./UpgradeOffer";

const useStyles = makeStyles((theme) => {
  const getColor = (color) =>
    theme.palette.type === "light" ? lighten(color, 0.62) : darken(color, 0.5);

  const backgroundPrimary = getColor(theme.palette.primary.main);
  const backgroundSecondary = getColor(theme.palette.secondary.main);

  return {
    label: {
      display: "flex",
      alignItems: "center",
    },
    labelText: {
      display: "inline-block",
      marginRight: 3,
    },
    progressBarDefault: {
      marginBottom: theme.spacing(2),
    },
    progressBarBuffer: {
      backgroundColor: backgroundPrimary,
      "& .MuiLinearProgress-bar2Buffer": {
        backgroundColor: backgroundSecondary,
      },
      "& .MuiLinearProgress-dashed": {
        animation: "none",
      },
    },
  };
});

const UserBoardUsage = (props) => {
  const {
    variant = "default",
    used,
    max,
    adjust = 0,
    label,
    help,
    UpgradeOfferProps = {},
    hideUpgradeOffer,
    loading,
    toFriendly = (value) => String(value),
  } = props;

  const friendlyUsed = toFriendly(Math.max(0, used + adjust));
  const friendlyMax = toFriendly(max);
  let friendlyAdjust = "";

  if (adjust > 0) {
    friendlyAdjust = `+${toFriendly(adjust)}`;
  } else if (adjust < 0) {
    friendlyAdjust = toFriendly(adjust);
  }

  if (friendlyAdjust) {
    friendlyAdjust = ` (${friendlyAdjust})`;
  }

  const classes = useStyles();

  let upgradeOffer = null;

  if (!hideUpgradeOffer) {
    upgradeOffer = (
      <UpgradeOffer
        TypographyProps={{
          gutterBottom: variant === "small",
          paragraph: variant !== "small",
        }}
        {...UpgradeOfferProps}
      />
    );
  }

  let tooltip = null;

  if (help) {
    tooltip = (
      <>
        <Typography
          variant="inherit"
          display="block"
          gutterBottom={variant === "small"}
        >
          {help}
        </Typography>
      </>
    );
  }

  const makeProgressValue = (value) => {
    return (max === -1 ? 0 : value / max) * 100;
  };

  let progressVariant = "determinate";
  let progressValue = makeProgressValue(used);
  let progressBuffer = makeProgressValue(0);

  if (loading) {
    progressValue = makeProgressValue(0);
  } else if (adjust > 0) {
    progressVariant = "buffer";
    progressBuffer = makeProgressValue(used + adjust);
  } else if (adjust < 0) {
    progressVariant = "buffer";
    progressValue = makeProgressValue(used + adjust);
    progressBuffer = makeProgressValue(used);
  }

  return (
    <>
      <Typography
        className={classes.label}
        variant={variant === "small" ? "body2" : "body1"}
      >
        <span className={classes.labelText}>
          {loading ||
            `${friendlyUsed}${friendlyAdjust} / ${friendlyMax} ${label}`}
        </span>
        {tooltip && (
          <Tooltip className={classes.tooltip} title={tooltip}>
            <HelpIcon fontSize="inherit" />
          </Tooltip>
        )}
      </Typography>
      <LinearProgress
        className={clsx({
          [classes.progressBarDefault]: variant !== "small",
          [classes.progressBarBuffer]: progressVariant === "buffer",
        })}
        variant={progressVariant}
        value={progressValue}
        valueBuffer={progressBuffer}
      />
      {variant !== "small" && upgradeOffer}
    </>
  );
};

UserBoardUsage.propTypes = {
  label: PropTypes.string.isRequired,
  used: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  adjust: PropTypes.number,
  toFriendly: PropTypes.func,
  variant: PropTypes.oneOf(["default", "small"]),
  help: PropTypes.string,
  UpgradeOfferProps: PropTypes.shape(UpgradeOffer.propTypes),
  hideUpgradeOffer: PropTypes.bool,
  loading: PropTypes.string,
};

export default UserBoardUsage;
