import React, { useState, useEffect } from "react";
import { compose } from "redux";
import Alert from "react-bootstrap/Alert";
import { Redirect, useLocation } from "react-router-dom";

import { initFirebase, getCallableFbFunction } from "../utils";
import SimpleNavBar from "../SimpleNavBar";
import restrictedPage from "../auth/restrictedPage";
import Loader from "../components/Loader";

initFirebase();

const ReportedBoard = () => {
  const [isLoading, setLoading] = useState(true);
  const [message, setMessage] = useState();
  const location = useLocation();

  useEffect(() => {
    const pathName = location.pathname;
    const query = new URLSearchParams(location.search);

    const removeBoard = async (board_id) => {
      const func = getCallableFbFunction("boards-removeReportedBoard");
      const params = {
        board_id,
      };

      try {
        await func(params);
        setMessage("Reported Board has been deleted successfully.");
      } catch (e) {
        setMessage(e.message);
      } finally {
        setLoading(false);
      }
    };

    const disableUser = async (user_id) => {
      const func = getCallableFbFunction("users-disableUser");
      const params = {
        user_id,
      };

      try {
        await func(params);
        setMessage("The user has been disabled successfully.");
      } catch (e) {
        setMessage(e.message);
      } finally {
        setLoading(false);
      }
    };

    const removeUser = async (user_id) => {
      const func = getCallableFbFunction("users-removeUser");
      const params = {
        user_id,
      };

      try {
        await func(params);
        setMessage("The user has been deleted successfully.");
      } catch (e) {
        setMessage(e.message);
      } finally {
        setLoading(false);
      }
    };

    if (pathName.includes("remove-board")) {
      const board_id = query.get("id");
      removeBoard(board_id);
    } else if (pathName.includes("disable-user")) {
      const user_id = query.get("id");
      disableUser(user_id);
    } else if (pathName.includes("remove-user")) {
      const user_id = query.get("id");
      removeUser(user_id);
    }
  }, [location]);

  let content;

  if (isLoading) {
    content = <Loader isFullScreen />;
  } else if (message) {
    content = <Alert>{message}</Alert>;
  } else {
    content = <Redirect to="/" />;
  }

  return (
    <>
      <SimpleNavBar />
      <div className="container-fluid">
        <div style={{ textAlign: "left" }}>
          <br />
          <br />
          <br />
          <div className="center margin-middle">{content}</div>
        </div>
      </div>
    </>
  );
};

const enhance = compose(restrictedPage());

export default enhance(ReportedBoard);
