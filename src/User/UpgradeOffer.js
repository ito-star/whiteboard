/* eslint-disable react/require-default-props */
import React, { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import Typography from "@material-ui/core/Typography";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { useSnackbar } from "notistack";

import useUser from "../auth/useUser";
import {
  PAID_ROLES,
  canUpgrade as canUpgradeUser,
  canUpgradeRole,
} from "../access";
import { getSubscriptionPlan } from "../stripe";
import Loader from "../components/Loader";

const UpgradeOffer = (props) => {
  const {
    prefix,
    className,
    targetRole,
    TypographyProps = {},
    prefixTypographyProps = {},
    linkTypographyProps = {},
  } = props;
  const { user, loadingUser } = useUser();
  const { enqueueSnackbar } = useSnackbar();
  const [targetPlanLoaded, setTargetPlanLoaded] = useState(false);
  const [targetPlan, setTargetPlan] = useState();

  const canUpgrade = useMemo(() => user && canUpgradeUser(user), [user]);
  const showTargetPlan = useMemo(() => canUpgrade && targetRole, [
    canUpgrade,
    targetRole,
  ]);

  useEffect(() => {
    const runner = async () => {
      if (showTargetPlan) {
        try {
          setTargetPlanLoaded(false);
          const plan = await getSubscriptionPlan(targetRole);
          setTargetPlan(plan);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error(err);

          enqueueSnackbar(err.toString(), {
            variant: "error",
          });
        } finally {
          setTargetPlanLoaded(true);
        }
      }
    };

    runner();
  }, [targetRole, showTargetPlan, enqueueSnackbar]);

  if (loadingUser) {
    return null;
  }

  if (!canUpgrade) {
    return null;
  }

  if (showTargetPlan && !targetPlanLoaded) {
    return <Loader />;
  }

  const rootClassName = clsx(
    "upgrade-offer",
    className,
    TypographyProps.className
  );
  delete TypographyProps.className;

  const defaults = {
    variant: "inherit",
  };

  const rootProps = {
    ...defaults,
    ...TypographyProps,
  };

  const prefixProps = {
    ...defaults,
    ...prefixTypographyProps,
  };

  const linkProps = {
    ...defaults,
    ...linkTypographyProps,
  };

  let linkText = "Upgrade to one of our paid plans today!";

  if (targetPlan) {
    let orHigher = "";

    if (canUpgradeRole(targetRole)) {
      orHigher = " (or higher)";
    }

    linkText = `Upgrade to our ${targetPlan.name}${orHigher} plan today!`;
  }

  return (
    <Typography className={rootClassName} {...rootProps}>
      <Typography {...prefixProps}>{prefix} </Typography>
      <Typography {...linkProps}>
        <Link to="/account/billing">{linkText}</Link>
      </Typography>
    </Typography>
  );
};

UpgradeOffer.propTypes = {
  prefix: PropTypes.string,
  className: PropTypes.string,
  targetRole: PropTypes.oneOf(PAID_ROLES),
  TypographyProps: PropTypes.shape(Typography.propTypes),
  prefixTypographyProps: PropTypes.shape(Typography.propTypes),
  linkTypographyProps: PropTypes.shape(Typography.propTypes),
};

export default UpgradeOffer;
