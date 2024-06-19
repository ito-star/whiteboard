import React, { useState, useEffect } from "react";
import { IconButton, Tooltip } from "@material-ui/core";
import {
  VisibilityOutlined as VisibilityIcon,
  LaunchOutlined as LaunchIcon,
} from "@material-ui/icons";
import FullBlockViewModal from "../FullBlockViewModal";
import useStyles from "./Image.styles";

const Image = ({
  imagePath,
  onExpand,
  onClose,
  isFullScreenMode,
  imageLink,
  renderFullScreenOnly = false,
}) => {
  const styles = useStyles();
  const [loaded, setLoaded] = useState(false);
  // Set Internal state for readonly mode
  const [fullScreen, setFullScreen] = useState(isFullScreenMode);
  useEffect(() => {
    setFullScreen(isFullScreenMode);
  }, [isFullScreenMode]);

  if (!imagePath) {
    return null;
  }

  const handleClickExpand = () => {
    setFullScreen(true);
    if (onExpand) onExpand();
  };

  const handleClose = () => {
    setFullScreen(false);
    if (onClose) onClose();
  };

  return (
    <>
      {!renderFullScreenOnly && (
        <div className="img-fluid-container" role="button" tabIndex={0}>
          <img src={imagePath} className="img-fluid" draggable="false" alt="" />
          <div className={styles.overlay}>
            <Tooltip title="Preview the image">
              <IconButton onClick={handleClickExpand}>
                <VisibilityIcon color="primary" fontSize="large" />
              </IconButton>
            </Tooltip>

            {imageLink && (
              <Tooltip title="Open the link in a new tab">
                <IconButton component="a" href={imageLink} target="_blank">
                  <LaunchIcon color="primary" fontSize="large" />
                </IconButton>
              </Tooltip>
            )}
          </div>
        </div>
      )}
      {fullScreen && (
        <FullBlockViewModal
          open={fullScreen}
          onClose={handleClose}
          isLoaded={loaded}
        >
          <div className="img-fluid-container">
            <img
              onLoad={() => setLoaded(true)}
              src={imagePath}
              className="img-fluid"
              draggable="false"
              alt=""
            />
          </div>
        </FullBlockViewModal>
      )}
    </>
  );
};

export default Image;
