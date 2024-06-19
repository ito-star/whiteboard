import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import _difference from "lodash/difference";
import pFilter from "p-filter";
import { useSnackbar } from "notistack";
import FileList from "../FileList";
import useUser from "../auth/useUser";
import {
  createUploadedFilesFilter,
  createUserFilesFilter,
  isFileDeletable,
} from "../utils";
import Loader from "../components/Loader";

const FileDeleteWarning = (props) => {
  const { files } = props;
  const [isLoading, setIsLoading] = useState(true);
  const [candiateFiles, setCanidateFiles] = useState([]);
  const [deletableFiles, setDeletableFiles] = useState([]);
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useUser();

  useEffect(() => {
    // Select files that are:
    //
    // - Actual uploaded files (as opposed to "external" files)
    // - Owned by the current user
    //
    // Any other files are not relevant to this warning
    setCanidateFiles(
      files
        .filter(createUploadedFilesFilter())
        .filter(createUserFilesFilter(user))
    );
  }, [files, user]);

  useEffect(() => {
    const runner = async () => {
      try {
        const filteredFiles = await pFilter(
          candiateFiles,
          async (file) => {
            return isFileDeletable(file);
          },
          {
            concurrency: 5,
          }
        );

        setDeletableFiles(filteredFiles);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(e);

        enqueueSnackbar(e.toString(), {
          variant: "error",
        });
      } finally {
        setIsLoading(false);
      }
    };

    runner();
  }, [candiateFiles, enqueueSnackbar]);

  const loading = <Loader />;

  if (isLoading) {
    return loading;
  }

  const nonDeletableFiles = _difference(candiateFiles, deletableFiles);

  let nonDeletableMessage = "";

  if (nonDeletableFiles.length) {
    nonDeletableMessage = (
      <>
        <p>
          The files listed below are being used by other Blocks. They will be
          removed from this Block, but remain within Whatboard file storage so
          that they can continue to be used by the other Blocks that are using
          them.
        </p>
        <FileList files={nonDeletableFiles} />
      </>
    );
  }

  let deleteableMessage = "";

  if (deletableFiles && deletableFiles.length) {
    deleteableMessage = (
      <>
        <p>
          The files listed below are no longer being used. They will be removed
          from this Block, and from Whatboard file storage.
        </p>
        <p>
          It is possible that these files are also being used in a manner that
          is not tracked by Whatboard. You may download these files to your
          computer so that you can supply them to anyone that needs them.
        </p>
        <FileList files={deletableFiles} />
      </>
    );
  }

  return (
    <>
      {nonDeletableMessage}
      {deleteableMessage}
    </>
  );
};

FileDeleteWarning.propTypes = {
  files: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default FileDeleteWarning;
