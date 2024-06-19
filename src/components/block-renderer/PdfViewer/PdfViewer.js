import React, { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf/dist/esm/entry.webpack";
import Box from "@material-ui/core/Box";
import NavigateBeforeIcon from "@material-ui/icons/NavigateBeforeOutlined";
import NavigateNextIcon from "@material-ui/icons/NavigateNextOutlined";
import FullBlockViewModal from "../FullBlockViewModal";
import { BlockTypes } from "../../../constant";
import { keyDownA11y } from "../../../utils";

const PdfViewer = ({
  pdfUrl,
  onLoadSuccess,
  maxPages,
  pageNumber,
  headerColor,
  onNextPage,
  onPrevPage,
  isFullScreenMode,
  onExpand,
  onClose,
  renderFullScreenOnly = false,
}) => {
  const [isPdfLoaded, setIsPdfLoaded] = useState(false);
  // Set Internal state for readonly mode
  const [fullScreen, setFullScreen] = useState(isFullScreenMode);

  useEffect(() => {
    setFullScreen(isFullScreenMode);
  }, [isFullScreenMode]);

  const handleSuccessRenderPdf = () => {
    if (isFullScreenMode) {
      setIsPdfLoaded(true);
    }
  };

  const handleClose = () => {
    setIsPdfLoaded(false);
    setFullScreen(false);
    if (onClose) onClose();
  };

  const handleClickExpand = () => {
    setFullScreen(true);
    if (onExpand) onExpand();
  };
  const documentElm = (
    <Document
      onLoadSuccess={onLoadSuccess}
      file={pdfUrl}
      loading={<div style={{ height: "80vh", width: "40vw" }} />}
      options={{
        cmapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/cmaps/`,
        cMapPacked: true,
      }}
    >
      <Page
        pageNumber={pageNumber}
        onRenderSuccess={handleSuccessRenderPdf}
        loading={<div style={{ height: "80vh", width: "40vw" }} />}
      />
      {pageNumber < maxPages && (
        <Box
          onClick={onNextPage}
          className="material-icons increment"
          bgcolor={
            headerColor === "#ffffff" || headerColor === "#ffffff00"
              ? "#2c387e"
              : headerColor
          }
        >
          <NavigateNextIcon />
        </Box>
      )}
      {pageNumber !== 1 && (
        <Box
          onClick={onPrevPage}
          className="material-icons decrement"
          bgcolor={
            headerColor === "#ffffff" || headerColor === "#ffffff00"
              ? "#2c387e"
              : headerColor
          }
        >
          <NavigateBeforeIcon />
        </Box>
      )}
    </Document>
  );

  return (
    <>
      {!renderFullScreenOnly && (
        <div
          className="pdf-wrapper"
          onClick={handleClickExpand}
          onKeyDown={keyDownA11y(handleClickExpand)}
          role="button"
          tabIndex={0}
        >
          {documentElm}
        </div>
      )}
      {fullScreen && (
        <FullBlockViewModal
          open={fullScreen}
          onClose={handleClose}
          type={BlockTypes.PDF}
          pdfParams={{
            pageNumber,
            maxPages,
            onPrev: onPrevPage,
            onNext: onNextPage,
          }}
          isLoaded={isPdfLoaded}
        >
          {documentElm}
        </FullBlockViewModal>
      )}
    </>
  );
};

export default PdfViewer;
