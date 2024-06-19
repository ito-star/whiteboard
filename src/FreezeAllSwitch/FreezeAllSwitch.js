import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import Button from "@material-ui/core/Button";
import Tooltip from "@material-ui/core/Tooltip";
import AcUnitIcon from "@material-ui/icons/AcUnitOutlined";
import TutorialPopper from "../components/TutorialPopper";
import { toggleFreezeAll } from "../actions/setting";
import useUser from "../auth/useUser";
import "./FreezeAllSwitch.scss";

const Mousetrap = require("mousetrap");
require("mousetrap/plugins/pause/mousetrap-pause");

const CompactTypeSwitch = ({ isBoardFrozen }) => {
  const dispatch = useDispatch();
  const [freezeClass, setFreezeClass] = useState(
    isBoardFrozen ? "toolbar-button alt-button" : "toolbar-button"
  );
  const [hideTutorial, setHideTutorial] = useState(false);
  const { user } = useUser();
  const btnRef = React.useRef(null);
  const label = isBoardFrozen ? "Unfreeze" : "Freeze";

  const toggleFreeze = () => {
    if (freezeClass === "toolbar-button") {
      setFreezeClass("toolbar-button alt-button");
    } else {
      setFreezeClass("toolbar-button");
    }

    dispatch(toggleFreezeAll());
  };

  useEffect(() => {
    Mousetrap.bind("alt+p", () => {
      toggleFreeze();
    });
  });

  return (
    <div className="bar-icon freeze-icon">
      {user.tutorialStep === 5 && !hideTutorial && (
        <TutorialPopper
          popperAnchor={btnRef.current}
          title="What does Freeze do?"
          subTitle="Freeze locks all your blocks positions. This ensures that you or someone you share your board with cannot alter the format of the blocks. If you want to move blocks just click the Freeze button again to unlock the blocks."
          onClose={() => setHideTutorial(true)}
          onTry={toggleFreeze}
          placement="top"
        />
      )}
      <Tooltip title="Alt+P" placement="top">
        <Button
          className={freezeClass}
          onClick={toggleFreeze}
          ref={btnRef}
          startIcon={<AcUnitIcon />}
          size="small"
        >
          {label}
        </Button>
      </Tooltip>
    </div>
  );
};

export default CompactTypeSwitch;
