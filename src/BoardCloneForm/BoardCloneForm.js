/* eslint-disable react/require-default-props */
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import firebase from "firebase/compat/app";
import "firebase/compat/database";
import Accordion from "@material-ui/core/Accordion";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import AccordionDetails from "@material-ui/core/AccordionDetails";
import Typography from "@material-ui/core/Typography";
import Checkbox from "@material-ui/core/Checkbox";
import FormControl from "@material-ui/core/FormControl";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormHelperText from "@material-ui/core/FormHelperText";
import Box from "@material-ui/core/Box";
import UserBoardUsage from "../User/UserBoardUsage";
import UserStorageUsage from "../User/UserStorageUsage";
import access from "../access";
import useUser from "../auth/useUser";
import AuthCheck from "../auth/AuthCheck";
import {
  getBlockFiles,
  createUploadedFilesFilter,
  createUserFilesFilter,
  getCallableFbFunction,
} from "../utils";
import { DangerText, SuccessText } from "./BoardCloneForm.styles";
import { StorageDetailsHelpIcon } from "./StorageDetails";

const BoardCloneForm = (props) => {
  const {
    board_id,
    formProps: formPropsInput = {},
    onSuccess = () => {},
    onSubmitting = () => {},
    onSubmitAccessChange = () => {},
    onError = () => {},
  } = props;

  const [isReady, setIsReady] = useState(true);
  const [storageAdjustment, setStorageAdjustment] = useState(0);
  const [canCloneFiles, setCanCloneFiles] = useState(true);
  const [formVals, setFormVals] = React.useState({});
  const { user } = useUser();

  const canCreateBoards = (currentUser) => {
    return access.canCreateBoards(currentUser);
  };

  useEffect(() => {
    const submitAccess = canCreateBoards(user);

    onSubmitAccessChange(submitAccess);
  }, [user, onSubmitAccessChange]);

  useEffect(() => {
    const runner = async () => {
      if (access.canUploadFiles(user)) {
        if (formVals.cloneFiles) {
          setIsReady(false);

          const blocksSnap = await firebase
            .database()
            .ref(`/blocks/${board_id}`)
            .once("value");
          const filesToClone = [];
          const userFilesFilter = createUserFilesFilter(user, true);
          const uploadedFilesFilter = createUploadedFilesFilter();

          blocksSnap.forEach((blockSnap) => {
            const blockFiles = getBlockFiles(blockSnap.val())
              .filter(userFilesFilter)
              .filter(uploadedFilesFilter);

            filesToClone.push(...blockFiles);
          });

          const totalFileSize = filesToClone.reduce((total, file) => {
            return total + file.fileSize;
          }, 0);

          const hasEnoughStorageSpace = access.hasEnoughStorageSpace(
            totalFileSize,
            user
          );

          setStorageAdjustment(totalFileSize);
          setCanCloneFiles(hasEnoughStorageSpace);
        } else {
          setStorageAdjustment(0);
        }
      } else {
        setCanCloneFiles(false);
      }

      setIsReady(true);
    };
    runner();
  }, [formVals.cloneFiles, user, board_id]);

  const cloneBoard = async () => {
    const func = getCallableFbFunction("boards-cloneBoard");
    const result = await func({
      boardId: board_id,
      cloneFiles: formVals.cloneFiles,
    });

    return result.data;
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    onSubmitting(true);

    try {
      const data = await cloneBoard();
      if (data.limited) {
        onError(new Error("Rate Limit Error!"));
      } else {
        onSuccess(data);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
    } finally {
      onSubmitting(false);
    }
  };

  const handleInputChange = (event) => {
    const { name, type, value, checked } = event.target;

    setFormVals({
      ...formVals,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const formProps = {
    id: `clone-board-form-${board_id}`,
    ...formPropsInput,
    onSubmit: handleFormSubmit,
  };

  const fallback = (
    <p>
      You have reached the maximum number of allowed boards for your account.
    </p>
  );

  const duplicateFilesLabel = (
    <Box component="span" display="inline-flex" alignItems="center">
      <span>Duplicate files uploaded by other users</span>
      <StorageDetailsHelpIcon formId={formProps.id} />
    </Box>
  );

  return (
    <>
      <AuthCheck accessCheck={canCreateBoards} fallback={fallback}>
        <form {...formProps}>
          <p>
            Cloning a board creates a new board and copies the content of this
            board into the new one. Before proceeding, please review the
            following:
          </p>
          <Accordion>
            <AccordionSummary
              aria-controls={`${formProps.id}-sharing-content`}
              id={`${formProps.id}-sharing-header`}
            >
              <Typography>Board Sharing Settings</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography component="div">
                <p>
                  <DangerText>NONE</DangerText> of the sharing settings for this
                  board will be transferred to the new board. This means that:
                </p>
                <ol>
                  <li>
                    Any collaborators on this board{" "}
                    <DangerText>WILL NOT</DangerText> be copied over to the new
                    board.
                  </li>
                  <li>
                    The new board <DangerText>WILL NOT</DangerText> be publicly
                    accessible
                  </li>
                </ol>
              </Typography>
            </AccordionDetails>
          </Accordion>
          <Accordion>
            <AccordionSummary
              aria-controls={`${formProps.id}-security-content`}
              id={`${formProps.id}-security-header`}
            >
              <Typography>Board Security Settings</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography component="div">
                <p>
                  <DangerText>NONE</DangerText> of the security settings for
                  this board will be transferred to the new board. This means
                  that the new board <DangerText>WILL NOT</DangerText> be
                  password protected.
                </p>
              </Typography>
            </AccordionDetails>
          </Accordion>
          <Accordion>
            <AccordionSummary
              aria-controls={`${formProps.id}-customization-content`}
              id={`${formProps.id}-customization-header`}
            >
              <Typography>Board Customization Settings</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography component="div">
                <p>
                  The following customization settings{" "}
                  <SuccessText>WILL</SuccessText> be transferred to the new
                  board:
                </p>
                <ol>
                  <li>Header Color</li>
                  <li>Body Color</li>
                </ol>
              </Typography>
            </AccordionDetails>
          </Accordion>
          <Accordion>
            <AccordionSummary
              aria-controls={`${formProps.id}-ownership-content`}
              id={`${formProps.id}-ownership-header`}
            >
              <Typography>Ownership of Content in the New Board</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>
                You will be given ownership of <strong>ALL</strong> blocks in
                the new board. The content of the blocks themselves will remain
                unchanged.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <FormControl
            className="checkbox-control mb-3"
            disabled={!canCloneFiles}
            error={!canCloneFiles}
            color="primary"
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(formVals.cloneFiles)}
                  onChange={handleInputChange}
                  name="cloneFiles"
                />
              }
              label={duplicateFilesLabel}
            />
            <FormHelperText>
              {!canCloneFiles &&
                "You do not have enough storage space to do this"}
            </FormHelperText>
          </FormControl>
        </form>
      </AuthCheck>
      <UserBoardUsage />
      <AuthCheck accessCheck={canCreateBoards}>
        <UserStorageUsage
          adjust={storageAdjustment}
          loading={!isReady ? "Calculating Storage Usage..." : ""}
        />
      </AuthCheck>
    </>
  );
};

BoardCloneForm.propTypes = {
  board_id: PropTypes.string.isRequired,
  formProps: PropTypes.shape({}),
  onSuccess: PropTypes.func,
  onSubmitting: PropTypes.func,
  onSubmitAccessChange: PropTypes.func,
};

export default BoardCloneForm;
