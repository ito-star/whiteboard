import React from "react";
import Avatar from "@material-ui/core/Avatar";
import useUser from "../auth/useUser";

const UserAvatar = (props) => {
  const { user } = props;
  const { user: currentUser } = useUser();
  const customer = user || currentUser;

  if (customer) {
    const fallback = (customer.displayName && customer.displayName[0]) || null;
    return (
      <Avatar alt={customer.displayName} src={customer.photoURL}>
        {fallback}
      </Avatar>
    );
  }

  return <Avatar className="user-avatar" />;
};

export default UserAvatar;
