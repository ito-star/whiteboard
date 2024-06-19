import React, { useEffect } from "react";
import { Box, IconButton } from "@material-ui/core";
import {
  CloseOutlined as Close,
  ZoomInOutlined as ZoomIn,
  ZoomOutOutlined as ZoomOut,
  ChevronLeftOutlined as ChevronLeft,
  ChevronRightOutlined as ChevronRight,
} from "@material-ui/icons";
import { useTransformContext, TransformComponent } from "react-zoom-pan-pinch";
import FitScreen from "../../icons/FitScreen";
import { BlockTypes } from "../../../constant";
import useStyles from "./FullBlockViewModal.styles";

const FullBlockView = ({
  pageNumber,
  maxPages,
  onPrev,
  onNext,
  onClose,
  type,
  children,
  isLoaded,
}) => {
  const styles = useStyles();
  const { zoomIn, zoomOut, resetTransform } = useTransformContext();
  useEffect(() => {
    if (isLoaded) {
      resetTransform();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- including `resetTransform` in the deps list causes the zoom buttons to break
  }, [isLoaded]);

  return (
    <>
      <Box className={styles.toolbar}>
        <IconButton className={styles.closeButton} onClick={onClose}>
          <Close htmlColor="white" fontSize="large" />
        </IconButton>
        <Box className={styles.toolbarControls}>
          <IconButton onClick={() => zoomIn()}>
            <ZoomIn htmlColor="white" fontSize="large" />
          </IconButton>
          <IconButton onClick={() => zoomOut()}>
            <ZoomOut htmlColor="white" fontSize="large" />
          </IconButton>
          <IconButton onClick={() => resetTransform()}>
            <FitScreen htmlColor="white" fontSize="large" />
          </IconButton>
        </Box>
      </Box>

      {type === BlockTypes.PDF && pageNumber !== 1 && (
        <IconButton
          onClick={() => {
            onPrev();
            resetTransform();
          }}
          className={styles.previousIcon}
        >
          <ChevronLeft htmlColor="white" fontSize="large" />
        </IconButton>
      )}

      {type === BlockTypes.PDF && pageNumber < maxPages && (
        <IconButton
          onClick={() => {
            onNext();
            resetTransform();
          }}
          className={styles.nextPageIcon}
        >
          <ChevronRight htmlColor="white" fontSize="large" />
        </IconButton>
      )}
      <TransformComponent wrapperClass={styles.transformWrapper}>
        {children}
      </TransformComponent>
    </>
  );
};

export default FullBlockView;
