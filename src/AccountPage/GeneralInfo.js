import React from "react";
import { Button, TextField } from "@material-ui/core";
import clsx from "clsx";
import ButtonLink from "../ButtonLink";
import UserAvatar from "../User/UserAvatar";
import UserBoardUsage from "../User/UserBoardUsage";
import UserStorageUsage from "../User/UserStorageUsage";
import useUser from "../auth/useUser";

const GeneralInfo = ({ role, pricesLoaded, prices }) => {
  const { user, updateUserProfile } = useUser();
  const [displayName, setDisplayName] = React.useState(user.displayName);

  const onChangeDisplayName = (e) => {
    setDisplayName(e.target.value);
  };

  const handleSaveChanges = () => {
    const newProfile = {
      displayName,
    };
    updateUserProfile(newProfile);
  };

  return (
    <div className="general-info-section">
      <h1 id="profile" className="account-header" style={{ fontSize: "36px" }}>
        Profile
      </h1>
      <div className="center mar account-section">
        <UserAvatar user={user} />
        <br />
        <br />

        {role === "free" && pricesLoaded && (
          <span className="current-plan">Free Plan</span>
        )}
        {role === "basic" && pricesLoaded && (
          <span className="current-plan">{prices.basic.name}</span>
        )}
        {role === "premium" && pricesLoaded && (
          <span className="current-plan">{prices.premium.name}</span>
        )}
        {role === "premium-plus" && pricesLoaded && (
          <span className="current-plan">{prices["premium-plus"].name}</span>
        )}

        <br />
        <br />
        <div className="account-name-container">
          <TextField
            className="material-input account-name"
            onChange={onChangeDisplayName}
            defaultValue={displayName}
            label="Display Name"
          />
        </div>
        <br />
      </div>
      <Button
        className={clsx(
          "confirm-button",
          user.displayName === displayName && "greyed"
        )}
        onClick={handleSaveChanges}
      >
        Save Changes
      </Button>
      <h1
        id="usage"
        className="center account-header"
        style={{ fontSize: "36px" }}
      >
        Usage
      </h1>

      <div className="usage-container account-section">
        <h2>Boards</h2>
        <div className="progress-wrapper">
          <UserBoardUsage variant="small" />
        </div>
        <h2>Storage</h2>
        <div className="progress-wrapper">
          <UserStorageUsage variant="small" />
        </div>

        <br />
        <br />
        <div className="center">
          <ButtonLink
            className="confirm-button upgrade-button"
            route="/account/billing"
          >
            Upgrade
          </ButtonLink>
        </div>
        <br />
      </div>
    </div>
  );
};

export default GeneralInfo;
