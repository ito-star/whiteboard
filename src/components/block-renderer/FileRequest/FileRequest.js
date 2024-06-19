import React, { useEffect, useState, useCallback } from "react";
import PropTypes from "prop-types";
import _omit from "lodash/omit";
import { Typography } from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import Skeleton from "@material-ui/lab/Skeleton";
import Uppy from "@uppy/core";
import { DashboardModal, DragDrop, useUppy } from "@uppy/react";
import UppySelectorUploader from "../../../UppySelectorUploader";
import FileList from "../../../FileList";
import Stack from "../../Stack";
import {
  makeUppyIdForBlock,
  getCommonOptions,
  makeRestrictionsForBlock,
} from "../../../uppy";

import { getCallableFbFunction, getBlockFiles } from "../../../utils";

import "@uppy/core/dist/style.css";
import "@uppy/drag-drop/dist/style.css";

const UPPY_ID_SUFFIX = "file-request";

const FileRequest = React.forwardRef(function FileRequest(props, ref) {
  const {
    block,
    onUploadComplete,
    FileListComponent,
    FileListComponentProps,
  } = props;
  const blockFiles = getBlockFiles(block);
  const { fileRequestSettings } = block;

  const [isDashboardOpen, setDashboardOpen] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState();
  const [creator, setCreator] = useState();

  useEffect(() => {
    const runner = async () => {
      try {
        const getBlockCreatorInfo = getCallableFbFunction(
          "blocks-getCreatorInfo"
        );
        const response = await getBlockCreatorInfo({
          blockId: block.id,
          boardId: block.board_id,
        });

        setCreator(response.data);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);

        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    runner();
  }, [block.id, block.board_id, block.created_by]);

  const uppy = useUppy(() => {
    const uppyOptions = {
      ...getCommonOptions(),
      id: makeUppyIdForBlock(block, UPPY_ID_SUFFIX),
    };

    const uppyInst = new Uppy(uppyOptions).use(UppySelectorUploader, {});

    return uppyInst;
  });

  const creatorUid = creator && creator.uid;
  const creatorWbid = creator && creator.wbid;

  useEffect(() => {
    if (!isLoading && !error) {
      uppy.setMeta({
        uploaderUid: creatorUid,
        uploaderWbid: creatorWbid,
      });
    }
  }, [uppy, isLoading, error, creatorUid, creatorWbid]);

  useEffect(() => {
    if (!isLoading && !error) {
      const uppyOptions = {
        id: makeUppyIdForBlock(block, UPPY_ID_SUFFIX),
        restrictions: {
          ...makeRestrictionsForBlock(block, creator),
        },
      };

      uppy.setOptions(uppyOptions);
    }
  }, [uppy, block, isLoading, error, creator]);

  useEffect(() => {
    const onComplete = (result) => {
      onUploadComplete(result.successful);
    };

    uppy.on("complete", onComplete);

    return () => {
      uppy.off("complete", onComplete);
    };
  }, [uppy, onUploadComplete, block]);

  const handleDashboardOpen = useCallback(
    (event) => {
      if (event.type === "click") {
        event.preventDefault();
        event.stopPropagation();
      }

      setDashboardOpen(true);
    },
    [setDashboardOpen]
  );

  const handleDashboardClose = useCallback(() => {
    setDashboardOpen(false);
  }, [setDashboardOpen]);

  let content;

  if (isLoading) {
    content = <Skeleton variant="rect" width="100%" height="100%" />;
  } else if (error) {
    content = <Alert severity="error">{error}</Alert>;
  } else {
    content = (
      <>
        <Typography align="center" variant="h6">
          Send me a file(s)
        </Typography>
        <div className="uppy-container">
          <DragDrop
            uppy={uppy}
            onClickCapture={handleDashboardOpen}
            onDrop={handleDashboardOpen}
            note={fileRequestSettings.note}
          />
          <DashboardModal
            style={{ width: 0, height: 0 }}
            uppy={uppy}
            open={isDashboardOpen}
            trigger={null}
            target={document.body}
            onRequestClose={handleDashboardClose}
            closeModalOnClickOutside
            closeAfterFinish
            note={fileRequestSettings.note}
            locale={{
              strings: {
                // Used as the label for the button that starts an upload.
                uploadXFiles: {
                  0: "Send me %{smart_count} file",
                  1: "Send me %{smart_count} files",
                },
                // Used as the label for the button that starts an upload, if another upload has been started in the past
                // and new files were added later.
                uploadXNewFiles: {
                  0: "Send me +%{smart_count} file",
                  1: "Send me +%{smart_count} files",
                },
              },
            }}
          />
        </div>
        <Typography align="center" variant="h6">
          Files you have sent me
        </Typography>
        {blockFiles.length ? (
          <FileListComponent
            orderBy={[{ prop: "fileName", dir: "asc" }]}
            {...FileListComponentProps}
            files={blockFiles}
          />
        ) : (
          <Alert severity="info">You have not sent me any files yet</Alert>
        )}
      </>
    );
  }

  return (
    <Stack width="100%" height="100%" spacing={1} ref={ref}>
      {content}
    </Stack>
  );
});

FileRequest.defaultProps = {
  onUploadComplete: () => {},
  FileListComponent: FileList,
  FileListComponentProps: {},
};

FileRequest.propTypes = {
  block: PropTypes.shape({}).isRequired,
  onUploadComplete: PropTypes.func,
  FileListComponent: PropTypes.elementType,
  FileListComponentProps: PropTypes.shape(_omit(FileList.propTypes, "files")),
};

export default FileRequest;
