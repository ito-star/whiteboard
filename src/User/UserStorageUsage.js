/* eslint-disable react/require-default-props */
import React from "react";
import PropTypes from "prop-types";

import useUser from "../auth/useUser";
import access from "../access";
import UserUsageBase from "./UserUsageBase";

const UserBoardUsage = (props) => {
  const { user: userProp, variant = "default", adjust = 0, loading } = props;
  const { user: currentUser, loadingUser } = useUser();

  const user = userProp || currentUser;

  if (loadingUser || !user) {
    return null;
  }

  const maxStorage = access.getMaxStorageSize(user);
  const storageUsed = user.usage.storage || 0;

  return (
    <UserUsageBase
      label="Storage"
      used={storageUsed}
      max={maxStorage}
      adjust={adjust}
      toFriendly={access.toFriendlyStorageSize}
      variant={variant}
      UpgradeOfferProps={{
        prefix: "Want more storage?",
      }}
      loading={loading}
    />
  );
};

UserBoardUsage.propTypes = {
  variant: UserUsageBase.propTypes.variant,
  user: PropTypes.shape({}),
  adjust: PropTypes.number,
  loading: UserUsageBase.propTypes.loading,
};

export default UserBoardUsage;
