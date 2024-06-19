import React, { useEffect, useState } from "react";
import { Redirect } from "react-router-dom";
import firebase from "firebase/compat/app";
import "firebase/compat/database";
import SimpleNavBar from "../SimpleNavBar";
import Loader from "../components/Loader";
import NotFoundPage from "../ReadOnlyBoard/NotFoundPage";

const FriendlyUrlPage = (props) => {
  const { match } = props;
  const [boardData, setBoardData] = useState(null);
  const [isNotFound, setIsNotFound] = useState(false);

  useEffect(() => {
    const getBoardData = async () => {
      const snap = await firebase
        .database()
        .ref(`friendlyUrl/${match.params.id}`)
        .once("value");

      if (snap.val()) {
        const { board_id, unique_url } = snap.val();
        setBoardData({ board_id, unique_url });
      } else {
        setIsNotFound(true);
      }
    };
    getBoardData();
  }, [match.params.id]);

  if (isNotFound) {
    return <NotFoundPage />;
  }

  if (boardData) {
    return (
      <Redirect
        to={`/readonlyboard/${boardData.board_id}?invitation=${boardData.unique_url}`}
      />
    );
  }

  const loading = <Loader isFullScreen />;

  return (
    <>
      <SimpleNavBar />
      <div className="container-fluid">
        <div style={{ textAlign: "left" }}>
          <br />
          <br />
          <br />
          <div className="center margin-middle">{loading}</div>
        </div>
      </div>
    </>
  );
};

export default FriendlyUrlPage;
