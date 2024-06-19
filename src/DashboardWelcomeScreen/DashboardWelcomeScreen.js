import React, { useState } from "react";
import { getCallableFbFunction } from "../utils";
import Loader from "../components/Loader";

import "./DashboardWelcomeScreen.scss";

const DashboardWelcomeScreen = () => {
  const [loading, setLoading] = useState(false);

  const handleReadmeCloneBoard = async () => {
    const func = getCallableFbFunction("users-cloneReadMeBoard");

    setLoading(true);
    await func().then(() => {
      setLoading(false);
    });
  };

  return (
    <div className="dashboard-welcome-screen">
      <div className="dashboard-welcome-screen-content">
        {loading ? (
          <Loader />
        ) : (
          <>
            <h1 className="dashboard-welcome-screen-content--header">What?</h1>
            <h1 className="dashboard-welcome-screen-content--sub">
              {" "}
              Let&apos;s get started by creating our first board
            </h1>
            <h1 className="dashboard-welcome-screen-content--sub">
              {" "}
              Click the blue button at the top, or{" "}
              <span
                className="dashboard-welcome-screen-content--sub_link"
                onClick={handleReadmeCloneBoard}
                onKeyPress={handleReadmeCloneBoard}
                role="button"
                tabIndex={0}
              >
                generate readme board
              </span>
            </h1>
            <br />
            <br />
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardWelcomeScreen;
