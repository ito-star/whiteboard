import React, { useState } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import {
  Badge,
  CircularProgress,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
} from "@material-ui/core";
import {
  GetAppOutlined as GetAppIcon,
  EjectOutlined as EjectIcon,
  DeleteOutlined as DeleteIcon,
  HelpOutlineOutlined as HelpIcon,
} from "@material-ui/icons";
import { useModal } from "mui-modal-provider";
import Dayjs from "dayjs";
import filesize from "filesize";
import { useConfirm } from "material-ui-confirm";
import { useSnackbar } from "notistack";
import isObjectUrl from "@uppy/utils/lib/isObjectURL";
import styled from "styled-components";
import { getCallableFbFunction } from "../utils";
import FileTypeIcon from "../FileTypeIcon";
import FileDeleteWarning from "../FileDeleteWarning";
import PdfViewer from "../components/block-renderer/PdfViewer";
import Image from "../components/block-renderer/Image";
import { BlockTypes } from "../constant";
import { allowedImageTypes, allowedPdfTypes } from "../uppy";

const FileViewer = (props) => {
  const {
    file,
    open, // Supplied by mui-modal-provider
    onClose, // Supplied by mui-modal-provider
  } = props;

  const [maxPages, setMaxPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);

  let type;

  if (allowedImageTypes.includes(file.fileType)) {
    type = BlockTypes.Image;
  } else if (allowedPdfTypes.includes(file.fileType)) {
    type = BlockTypes.PDF;
  }

  const incrementPage = (evt) => {
    if (evt) evt.stopPropagation();

    if (pageNumber < maxPages) {
      setPageNumber(pageNumber + 1);
    }
  };

  const decrementPage = (evt) => {
    if (evt) evt.stopPropagation();

    if (pageNumber !== 1) {
      setPageNumber(pageNumber - 1);
    }
  };

  if (type === BlockTypes.Image) {
    return (
      <Image
        imagePath={file.filePath}
        isFullScreenMode={open}
        onClose={onClose}
        renderFullScreenOnly
      />
    );
  }

  if (type === BlockTypes.PDF) {
    return (
      <PdfViewer
        pdfUrl={file.filePath}
        onLoadSuccess={(pdf) => setMaxPages(pdf.numPages)}
        maxPages={maxPages}
        pageNumber={pageNumber}
        isFullScreenMode={open}
        onClose={onClose}
        onNextPage={incrementPage}
        onPrevPage={decrementPage}
        renderFullScreenOnly
      />
    );
  }

  return null;
};

FileViewer.propTypes = {
  file: PropTypes.shape({}).isRequired,
};

const StyledListItem = styled(ListItem).withConfig({
  shouldForwardProp: (prop) => {
    return !["numActions"].includes(prop);
  },
})`
  &.MuiListItem-secondaryAction {
    padding-right: ${(props) => `${props.numActions * 48}px`};
  }
`;

const FileListItem = React.forwardRef(function FileLIstItem(props, ref) {
  const {
    file,
    isRemovable,
    isPopout,
    handlePopoutFile,
    handleRemoveFile,
    loggedInLastViewed,
    index,
    className,
    onClick,
    ...ListItemProps
  } = props;

  const confirm = useConfirm();
  const { enqueueSnackbar } = useSnackbar();
  const [isDownloadButtonLoading, setIsDownloadButtonLoading] = useState(false);
  const { showModal } = useModal();

  const isExternal = !file.storagePath;
  const hasNewUpdates =
    loggedInLastViewed &&
    Dayjs(file.uploadDate).isAfter(Dayjs(loggedInLastViewed));

  const handleClickItem = (event) => {
    const nearestClickable = event?.target?.closest?.(
      "a,button,[role='button']"
    );

    if (nearestClickable && nearestClickable.matches(".file-list-item")) {
      showModal(FileViewer, { file }, { destroyOnClose: true });
    }

    if (onClick) {
      onClick(event);
    }
  };

  const onClickDeleteButton = async () => {
    try {
      await confirm({
        title: "Are you sure you want to delete this file?",
        description: <FileDeleteWarning files={[file]} />,
        confirmationText: "Delete",
      });

      handleRemoveFile(file);
    } catch (e) {
      // Cancelling a confirmation dialog results in a rejected Promise, but said rejection always returns `undefined`, whereas
      // other exceptions or rejected Promises will usually be an object of some sort.
      if (e) {
        throw e;
      }
    }
  };

  const onClickDownloadButton = async () => {
    try {
      setIsDownloadButtonLoading(true);
      let downloadUrl;

      // Handle Files that have a Blob URL as their primary URL.
      //
      // These are usually files that have been added via our Uppy
      // File Selector, but not uploaded yet.
      if (isObjectUrl(file.filePath)) {
        downloadUrl = file.filePath;
      } else {
        // Handle:
        //
        // - Files that have been uploaded to Whatboard File Storage.
        //   These will return a URL that prompts the user with a
        //   "Save As" dialog.
        //
        // - External Files
        //   These will return the URL verbatim.
        const func = getCallableFbFunction("files-getDownloadUrl");

        const result = await func({
          url: file.filePath,
        });

        downloadUrl = result.data.downloadUrl;
      }

      window.open(downloadUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);

      enqueueSnackbar(e.toString(), {
        variant: "error",
      });
    } finally {
      setIsDownloadButtonLoading(false);
    }
  };

  const downloadButtonLoadingIcon = (
    <CircularProgress color="primary" size={16} />
  );

  let numActions = 1;

  if (isPopout) {
    numActions += 1;
  }

  if (isRemovable) {
    numActions += 1;
  }

  return (
    <StyledListItem
      {...ListItemProps}
      className={clsx("file-list-item", className)}
      onClick={handleClickItem}
      button
      divider
      disableGutters
      ref={ref}
      numActions={numActions}
    >
      <ListItemIcon>
        <Badge
          color="secondary"
          variant="dot"
          anchorOrigin={{ vertical: "top", horizontal: "left" }}
          invisible={!hasNewUpdates}
        >
          <FileTypeIcon fileType={file.fileType} />
        </Badge>
      </ListItemIcon>
      <ListItemText disableTypography className="file-list-item-info">
        <div className="file-list-item-name">{file.fileName}</div>
        <div className="file-list-item-date">
          {Dayjs(file.uploadDate).format("MM/DD/YY hh:mm A")}
        </div>
        <div className="file-list-item-size">{filesize(file.fileSize)}</div>
        {isExternal && (
          <div className="file-list-item-external">
            <span className="file-list-item-external-text">External</span>
            <Tooltip title="External files exist outside of the control of this block. Whatboard makes no guarantees as to the availability of external files.">
              <HelpIcon fontSize="inherit" />
            </Tooltip>
          </div>
        )}
      </ListItemText>
      <ListItemSecondaryAction>
        <IconButton
          disabled={isDownloadButtonLoading}
          onClick={() => {
            onClickDownloadButton();
          }}
        >
          {isDownloadButtonLoading ? downloadButtonLoadingIcon : <GetAppIcon />}
        </IconButton>
        {isPopout && (
          <IconButton
            onClick={() => {
              handlePopoutFile(file, index);
            }}
          >
            <EjectIcon />
          </IconButton>
        )}
        {isRemovable && (
          <IconButton
            onClick={() => {
              onClickDeleteButton(file);
            }}
          >
            <DeleteIcon />
          </IconButton>
        )}
      </ListItemSecondaryAction>
    </StyledListItem>
  );
});

FileListItem.defaultProps = {
  isRemovable: false,
  isPopout: false,
  handlePopoutFile: () => {},
  handleRemoveFile: () => {},
  index: 0,
};

FileListItem.propTypes = {
  ...ListItem.propTypes,
  file: PropTypes.shape({}).isRequired,
  isRemovable: PropTypes.bool,
  isPopout: PropTypes.bool,
  handlePopoutFile: PropTypes.func,
  handleRemoveFile: PropTypes.func,
  index: PropTypes.number,
};

export default FileListItem;
