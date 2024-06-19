import React, { useEffect } from "react";
import PropTypes from "prop-types";
import firebase from "firebase/compat/app";
import "firebase/compat/database";
import AvatarGroup from "@material-ui/lab/AvatarGroup";
import Avatar from "@material-ui/core/Avatar";
import Tooltip from "@material-ui/core/Tooltip";
import DatabaseEventManager from "../DatabaseEventManager";
import "./CurrentUsersViewing.scss";

const CurrentUsersViewing = (props) => {
  const { boardId } = props;
  const [users, setUsersInfo] = React.useState([]);
  const getUsersTooltipText = () => {
    const userDisplayNames = [];

    for (let x = 0; x < users.length; x += 1) {
      userDisplayNames.push(users[x].displayName);
    }

    if (userDisplayNames) {
      return userDisplayNames.join();
    }

    return false;
  };

  const renderTitleText = () => {
    const content = (
      <div>
        {users &&
          users.map((name) => {
            const fallback = (name.displayName && name.displayName[0]) || null;

            return (
              <div className="current-users-viewing-title-text" key={name.id}>
                <Avatar
                  alt={name.displayName}
                  src={name.photoURL}
                  style={{ height: "25px", width: "25px" }}
                >
                  {fallback}
                </Avatar>
                <p className="current-users-viewing-title-text__display-name">
                  {name.displayName}
                </p>
              </div>
            );
          })}
      </div>
    );

    return content;
  };

  useEffect(() => {
    const dbEventManager = new DatabaseEventManager();

    const loggedInViewingRef = firebase
      .database()
      .ref(`whiteboards/${boardId}/currentViewingUsers`);

    dbEventManager.on(loggedInViewingRef, "value", (snapshot) => {
      const usersArray = [];
      const { loggedInUserEmail } = props;

      snapshot.forEach((userSnap) => {
        if (userSnap.key === loggedInUserEmail) {
          return;
        }

        usersArray.push({ id: userSnap.key, ...userSnap.val() });
      });

      setUsersInfo(usersArray);
    });

    return () => {
      dbEventManager.unsubscribe();
    };
  }, [boardId, props]);

  return (
    <Tooltip title={renderTitleText()} aria-label={getUsersTooltipText()}>
      <AvatarGroup max={4} spacing="small">
        {users &&
          users.map((name) => {
            const fallback = (name.displayName && name.displayName[0]) || null;

            return (
              <Avatar alt={name.displayName} key={name.id} src={name.photoURL}>
                {fallback}
              </Avatar>
            );
          })}
      </AvatarGroup>
    </Tooltip>
  );
};

CurrentUsersViewing.propTypes = {
  boardId: PropTypes.string.isRequired,
  loggedInUserEmail: PropTypes.string.isRequired,
};

export default CurrentUsersViewing;
