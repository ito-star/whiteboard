/* eslint-disable react/require-default-props */
import React from "react";
import PropTypes from "prop-types";
import _get from "lodash/get";
import useUser from "../auth/useUser";
import access from "../access";
import UserUsageBase from "./UserUsageBase";

const UserBoardUsage = (props) => {
  const { user: userProp, variant = "default" } = props;
  const { user: currentUser, loadingUser } = useUser();

  const user = userProp || currentUser;

  if (loadingUser || !user) {
    return null;
  }

  const maxBoardCount = access.getMaxBoardCount(user);
  const boardsUsed = _get(user, "usage.boards", 0);

  return (
    <UserUsageBase
      label="Boards"
      used={boardsUsed}
      max={maxBoardCount}
      toFriendly={access.toFriendlyBoardCount}
      variant={variant}
      help="Boards shared with you by other users do not count towards this limit"
      UpgradeOfferProps={{
        prefix: "Want more boards?",
      }}
    />
  );
};

UserBoardUsage.propTypes = {
  variant: UserUsageBase.propTypes.variant,
  user: PropTypes.shape({}),
};

export default UserBoardUsage;
