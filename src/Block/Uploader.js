import React, { useEffect, useState, useCallback } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import ButtonBase from "@material-ui/core/ButtonBase";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from "@material-ui/core/IconButton";
import ErrorIcon from "@material-ui/icons/ErrorOutlineOutlined";
import { makeStyles } from "@material-ui/core/styles";
import Uppy from "@uppy/core";
import { DashboardModal, StatusBar, useUppy } from "@uppy/react";
import UppyFirebase from "../UppyFirebase";
import CircularProgressWithLabel from "../CircularProgressWithLabel";
import useUser from "../auth/useUser";
import { initFirebase } from "../utils";
import {
  makeUppyIdForBlock,
  getCommonOptions,
  makeRestrictionsForBlock,
  makeUploadFolderForBlock,
} from "../uppy";

import "@uppy/core/dist/style.css";
import "@uppy/dashboard/dist/style.css";
import "./Uploader.scss";

initFirebase();

const useStyles = makeStyles((theme) => ({
  error: {
    color: theme.palette.error.main,
  },
}));

const UPPY_ID_SUFFIX = "uploader";

const Uploader = React.forwardRef(function Uploader(props, ref) {
  const {
    block,
    extractedFiles,
    onUploadComplete,
    onFileRemoved: onFileRemovedProp,
    onUploadCancelled,
  } = props;
  const { user } = useUser();
  const [totalProgress, setTotalProgress] = useState(0);
  const [isError, setIsError] = useState(false);
  const [isDashboardOpen, setDashboardOpen] = useState(false);

  const uppy = useUppy(() => {
    const uppyOptions = {
      ...getCommonOptions(),
      id: makeUppyIdForBlock(block, UPPY_ID_SUFFIX),
    };

    const uppyInst = new Uppy(uppyOptions).use(UppyFirebase, {
      metaFields: ["uploaderUid", "uploaderWbid"],
      folder: makeUploadFolderForBlock(block),
    });

    return uppyInst;
  });

  useEffect(() => {
    uppy.setMeta({
      uploaderUid: user.uid,
      uploaderWbid: user.wbid,
    });
  }, [uppy, user.uid, user.wbid]);

  useEffect(() => {
    const uppyOptions = {
      id: makeUppyIdForBlock(block, UPPY_ID_SUFFIX),
      restrictions: {
        ...makeRestrictionsForBlock(block, user),
      },
    };

    uppy.setOptions(uppyOptions);
    uppy.getPlugin("UppyFirebase").setOptions({
      folder: makeUploadFolderForBlock(block),
    });
  }, [uppy, block, user]);

  useEffect(() => {
    const onFileRemoved = (file, reason) => {
      if (reason === "removed-by-user") {
        onFileRemovedProp(file);
      }
    };

    const onProgress = (progress) => {
      setTotalProgress(progress);
    };

    const onComplete = (result) => {
      onUploadComplete(result.successful);
    };

    const onError = () => {
      setIsError(true);
    };

    const onUploadError = () => {
      setIsError(true);
    };

    const onUploadRetry = () => {
      setIsError(false);
    };

    const onCancelAll = () => {
      onUploadCancelled();
    };

    const onResetProgress = () => {
      setTotalProgress(0);
    };

    uppy
      .on("file-removed", onFileRemoved)
      .on("progress", onProgress)
      .on("complete", onComplete)
      .on("error", onError)
      .on("upload-error", onUploadError)
      .on("upload-retry", onUploadRetry)
      .on("cancel-all", onCancelAll)
      .on("reset-progress", onResetProgress);

    return () => {
      uppy
        .off("file-removed", onFileRemoved)
        .off("progress", onProgress)
        .off("complete", onComplete)
        .off("error", onError)
        .off("upload-error", onUploadError)
        .off("upload-retry", onUploadRetry)
        .off("cancel-all", onCancelAll)
        .off("reset-progress", onResetProgress);
    };
  }, [uppy, onUploadComplete, onFileRemovedProp, onUploadCancelled]);

  useEffect(() => {
    const runner = async () => {
      const currentFiles = uppy.getFiles();
      let hasNewFiles = false;

      extractedFiles.forEach((paths, file) => {
        let uppyFile = file;

        if (file instanceof File || file instanceof Blob) {
          uppyFile = {
            source: "Local",
            name: file.name,
            type: file.type,
            data: file,
            size: file.size,
            meta: {
              // path of the file relative to the ancestor directory the user selected.
              // e.g. 'docs/Old Prague/airbnb.pdf'
              relativePath: file.relativePath || null,
            },
          };
        }

        const existingFile = currentFiles.find((currentFile) => {
          return (
            currentFile.id === uppyFile.id || currentFile.data || uppyFile.data
          );
        });

        if (!existingFile) {
          hasNewFiles = true;
          uppy.addFile(uppyFile);
        }
      });

      try {
        if (hasNewFiles) {
          await uppy.upload();
        }
      } catch (e) {
        //  Do nothing
      }
    };
    runner();
  }, [uppy, extractedFiles]);

  const classes = useStyles();
  const progressClasses = clsx({
    "block-uploader-progress": true,
    [classes.error]: isError,
  });
  const progressId = `block-uploader-progress-${block.id}`;

  const handleDashboardOpen = useCallback(() => {
    setDashboardOpen(true);
  }, [setDashboardOpen]);

  const handleDashboardClose = useCallback(() => {
    setDashboardOpen(false);
  }, [setDashboardOpen]);

  const doneButtonHandler = useCallback(() => {
    handleDashboardClose();
  }, [handleDashboardClose]);

  let progressElement;

  if (!isError) {
    progressElement = (
      <ButtonBase onClick={handleDashboardOpen} id={progressId}>
        <CircularProgressWithLabel
          value={Number(totalProgress)}
          size={130}
          className="block-uploader-progress-bar"
          TypographyProps={{
            className: "block-uploader-progress-label",
          }}
        />
      </ButtonBase>
    );
  } else {
    progressElement = (
      <IconButton
        id={progressId}
        onClick={handleDashboardOpen}
        color="inherit"
        className="block-uploader-progress-error"
      >
        <ErrorIcon />
      </IconButton>
    );
  }

  return (
    <div ref={ref} className="block-uploader">
      <div className={progressClasses}>
        <Tooltip title="Click for details">{progressElement}</Tooltip>
      </div>
      <div className="block-uploader-status">
        <StatusBar
          uppy={uppy}
          showProgressDetails
          hideUploadButton
          hideAfterFinish={false}
        />
      </div>
      <DashboardModal
        uppy={uppy}
        open={isDashboardOpen}
        trigger={`#${progressId}`}
        target={document.body}
        onRequestClose={handleDashboardClose}
        closeModalOnClickOutside
        hideUploadButton
        doneButtonHandler={doneButtonHandler}
      />
    </div>
  );
});

Uploader.propTypes = {
  block: PropTypes.shape({}).isRequired,
  extractedFiles: PropTypes.instanceOf(Map).isRequired,
  onUploadComplete: PropTypes.func.isRequired,
  onFileRemoved: PropTypes.func.isRequired,
  onUploadCancelled: PropTypes.func.isRequired,
};

export default Uploader;
