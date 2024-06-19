import React from "react";
import { Box, Modal } from "@material-ui/core";
import { TransformWrapper } from "react-zoom-pan-pinch";
import { BlockTypes } from "../../../constant";
import FullBlockView from "./FullBlockView";
import useStyles from "./FullBlockViewModal.styles";

const FullBlockViewModal = ({
  open,
  onClose,
  pdfParams = {},
  children,
  type = BlockTypes.Image,
  isLoaded,
}) => {
  const styles = useStyles();
  const { pageNumber, maxPages, onPrev, onNext } = pdfParams;

  return (
    <Modal
      open={open}
      onClose={onClose}
      hideBackdrop
      className={styles.root}
      keepMounted={false}
    >
      <Box className={styles.wrapper}>
        <TransformWrapper initialScale={1} centerOnInit>
          <FullBlockView
            pageNumber={pageNumber}
            maxPages={maxPages}
            onPrev={onPrev}
            onNext={onNext}
            onClose={onClose}
            type={type}
            isLoaded={isLoaded}
          >
            {children}
          </FullBlockView>
        </TransformWrapper>
      </Box>
    </Modal>
  );
};

export default FullBlockViewModal;
