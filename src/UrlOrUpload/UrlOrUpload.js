import React, { Component } from "react";
import PropTypes from "prop-types";
import access from "../access";
import FileList from "../FileList";
import FileUploadButton from "../FileUploadButton";
import AuthCheck from "../auth/AuthCheck";
import UpgradeOffer from "../User/UpgradeOffer";
import UserContext from "../auth/UserContext";
import { getBlockFiles } from "../utils";
import UrlField from "../BlockModal/UrlField";

export default class UrlOrUpload extends Component {
  canUploadFiles = (user) => {
    return access.canUploadFiles(user);
  };

  render() {
    const {
      block,
      inputProps,
      fileUploadButtonProps,
      children,
      onFileListDelete,
      handleUrlUploadChange,
    } = this.props;
    const isInputVisible = Object.keys(inputProps).length > 0;
    let uploadedFile;

    if (isInputVisible) {
      const blockFiles = getBlockFiles(block);
      uploadedFile = blockFiles.find((file) => {
        const inputValue = inputProps.value || inputProps.defaultValue;
        return file.filePath === inputValue;
      });
    }

    const fallback = (
      <UpgradeOffer
        prefix={
          isInputVisible
            ? "Want to upload a file instead?"
            : "Want to upload files?"
        }
        className="mt-3"
        TypographyProps={{ variant: "body1", align: "center" }}
      />
    );

    return (
      <>
        {isInputVisible && (
          <>
            {!uploadedFile && <UrlField {...inputProps} />}
            {uploadedFile && (
              <FileList
                files={[uploadedFile]}
                isRemovable={Boolean(onFileListDelete)}
                handleRemoveFile={onFileListDelete}
              />
            )}
          </>
        )}
        <AuthCheck accessCheck={this.canUploadFiles} fallback={fallback}>
          {isInputVisible && <p className="mt-3 text-center">OR</p>}
          <FileUploadButton
            {...fileUploadButtonProps}
            handleUrlUploadChange={handleUrlUploadChange}
          >
            {children}
          </FileUploadButton>
        </AuthCheck>
      </>
    );
  }
}

UrlOrUpload.contextType = UserContext;

UrlOrUpload.defaultProps = {
  inputProps: {},
  fileUploadButtonProps: {},
  onFileListDelete: null,
};

UrlOrUpload.propTypes = {
  block: PropTypes.shape({}).isRequired,
  inputProps: PropTypes.shape({}),
  fileUploadButtonProps: PropTypes.shape({}),
  handleUrlUploadChange: PropTypes.func.isRequired,
  onFileListDelete: PropTypes.func,
};
