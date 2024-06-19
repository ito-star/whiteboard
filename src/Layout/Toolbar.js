import React, { useRef, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Menu, Button, MenuItem } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import AddIcon from "@material-ui/icons/AddOutlined";
import ExpandMoreIcon from "@material-ui/icons/ExpandMoreOutlined";
import Tooltip from "@material-ui/core/Tooltip";
import TutorialPopper from "../components/TutorialPopper";
import { BlockTypes, isLightBodyColor } from "../constant";
import access from "../access";
import useUser from "../auth/useUser";
import BlockTypeMenuItem from "../BlockTypeMenuItem";

const useStyles = makeStyles(() => ({
  dropdownButton: {
    borderRadius: 20,
  },
}));

const Toolbar = ({ onClickAddItem }) => {
  const styles = useStyles();
  const { user } = useUser();
  const speedBtnRef = useRef(null);
  const [activeRef, setActiveRef] = useState(null);
  const { headerColor } = useSelector((state) => state.setting);

  useEffect(() => {
    if (user.tutorialStep) {
      switch (user.tutorialStep) {
        case 2:
          setActiveRef(speedBtnRef);
          break;
        default:
          setActiveRef(null);
      }
    }
  }, [user.tutorialStep]);

  const [anchorEl, setAnchorEl] = useState(null);

  const handleOpen = (e) => {
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const accessCheck = (blockType) => () => {
    return access.canCreateBlocksOfType(blockType, user);
  };

  const handleClickAction = (blockType) => {
    if (!blockType) {
      onClickAddItem();
    } else if (accessCheck(blockType)()) {
      onClickAddItem(blockType);
    }
  };

  const handleTutorialTry = () => {
    if (user.tutorialStep) {
      switch (user.tutorialStep) {
        case 2:
          onClickAddItem();
          break;
        default:
      }
    }
  };

  const actions = [
    { type: BlockTypes.Text },
    { type: BlockTypes.PDF },
    { type: BlockTypes.Image },
    { type: BlockTypes.Video },
    { type: BlockTypes.Files },
  ];

  const iconColor = isLightBodyColor(headerColor) ? "primary" : "default";

  return (
    <>
      {activeRef && (
        <TutorialPopper
          popperAnchor={activeRef.current}
          onClose={() => setActiveRef(null)}
          onTry={() => handleTutorialTry()}
          placement="left-start"
        />
      )}
      <Tooltip title="Add a new Block" placement="bottom">
        <Button
          ref={speedBtnRef}
          variant="contained"
          color={iconColor}
          endIcon={<ExpandMoreIcon htmlColor={iconColor} />}
          onClick={handleOpen}
          className={styles.dropdownButton}
          size="large"
        >
          <AddIcon htmlColor={iconColor} />
        </Button>
      </Tooltip>
      <Menu
        id="material-ui-split-button-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        getContentAnchorEl={null}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        anchorOrigin={{
          horizontal: "right",
          vertical: "bottom",
        }}
      >
        {actions
          .map((action) => {
            return (
              <BlockTypeMenuItem
                key={action.type}
                blockType={action.type}
                button
                onClick={() => {
                  handleClickAction(action.type);
                  handleClose();
                }}
              />
            );
          })
          .concat([
            <MenuItem
              key="more"
              onClick={() => {
                handleClickAction();
                handleClose();
              }}
            >
              More...
            </MenuItem>,
          ])}
      </Menu>
    </>
  );
};

export default Toolbar;
