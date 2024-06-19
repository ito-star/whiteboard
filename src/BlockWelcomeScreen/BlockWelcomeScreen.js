import React from "react";
import AddIcon from "@material-ui/icons/AddOutlined";
import PropTypes from "prop-types";

import "./BlockWelcomeScreen.scss";

const BlockWelcomeScreen = (props) => {
  const { type } = props;

  const renderReadOnlyBlockWelcomeScreen = () => {
    return (
      <div className="block-welcome-screen">
        <div className="block-welcome-screen-content">
          <h1 className="block-welcome-screen-content--header">What?</h1>
          <h1 className="block-welcome-screen-content--sub">
            Content coming soon... Please wait for the creator of this board to
            add content.
          </h1>
        </div>
      </div>
    );
  };

  const renderBlockWelcomeScreen = () => {
    return (
      <div className="block-welcome-screen">
        <div className="block-welcome-screen-content">
          <h1 className="block-welcome-screen-content--header">What?</h1>
          <h1 className="block-welcome-screen-content--sub">
            {" "}
            Let&apos;s get started by creating our first block
          </h1>
          <h1 className="block-welcome-screen-content--sub">
            Drag and drop files onto this board to add content. Or, click the
            &quot;
            <AddIcon /> icon&quot; in the top right-hand corner to add a variety
            of different content blocks.
          </h1>
          <br />
          <br />
        </div>
      </div>
    );
  };

  return (
    <>
      <>{type === "regular" && renderBlockWelcomeScreen()}</>
      <>{type === "readOnly" && renderReadOnlyBlockWelcomeScreen()}</>
    </>
  );
};

BlockWelcomeScreen.defaultProps = {
  type: "regular",
};

BlockWelcomeScreen.propTypes = {
  type: PropTypes.string,
};

export default BlockWelcomeScreen;
