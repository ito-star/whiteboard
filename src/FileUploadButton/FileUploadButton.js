import { Dashboard } from "@uppy/react";
import React, { Component } from "react";
import Uppy from "@uppy/core";
import { utils, write } from "xlsx";
import UserContext from "../auth/UserContext";
import UserStorageUsage from "../User/UserStorageUsage";
import UppySelectorUploader from "../UppySelectorUploader";
import {
  shouldUpdateStorageAdjustment,
  calcStorageAdjustment,
} from "../useCalcStorageAdjustment";
import {
  makeUppyIdForBlock,
  getCommonOptions,
  makeRestrictionsForBlock,
} from "../uppy";
import { getBlockFiles, getBlockUrlProp } from "../utils";
import { BlockTypes } from "../constant";
import "./FileUploadButton.scss";

import "@uppy/core/dist/style.css";
import "@uppy/dashboard/dist/style.css";

const UPPY_ID_SUFFIX = "selector";

export default class FileUploadButton extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loadingStorageAdjustment: true,
      storageAdjustment: 0,
    };
    const { block } = props;

    const uppyOptions = {
      ...getCommonOptions(),
      id: makeUppyIdForBlock(block, UPPY_ID_SUFFIX),
    };

    this.uppy = new Uppy(uppyOptions);

    this.uppy.use(UppySelectorUploader, {});

    this.updateUppyOptions = this.updateUppyOptions.bind(this);
    this.handleUploadComplete = this.handleUploadComplete.bind(this);

    this.uppy.on("complete", this.handleUploadComplete);
  }

  async componentDidMount() {
    const { onUppy } = this.props;
    await this.calcStorageAdjustment();
    this.updateUppyOptions();

    if (onUppy) {
      onUppy(this.uppy);
    }
  }

  async componentDidUpdate(prevProps) {
    const { block } = this.props;
    const { block: prevBlock } = prevProps;
    const updateStorageAdjustment = shouldUpdateStorageAdjustment(
      block,
      prevBlock
    );

    if (block.type !== prevBlock.type || block.id !== prevBlock.id) {
      this.uppy.reset();
    }

    if (updateStorageAdjustment) {
      await this.calcStorageAdjustment(prevProps);
    }
    this.updateUppyOptions();
  }

  componentWillUnmount() {
    this.uppy.close();
  }

  calcStorageAdjustment = async (prevProps) => {
    let { storageAdjustment } = this.state;
    let prevBlock;
    const { block } = this.props;
    const { user } = this.context;

    this.setState({
      loadingStorageAdjustment: true,
    });

    if (prevProps) {
      prevBlock = prevProps.block;
    }

    storageAdjustment += await calcStorageAdjustment(block, prevBlock, user);

    this.setState({
      storageAdjustment,
      loadingStorageAdjustment: false,
    });
  };

  handleUploadComplete = (result) => {
    const { handleUrlUploadChange } = this.props;

    result.successful.forEach((file) => {
      this.uppy.removeFile(file.id);
    });

    handleUrlUploadChange(result.successful);
  };

  updateUppyOptions() {
    const { block } = this.props;
    const { user } = this.context;
    const { storageAdjustment } = this.state;

    let hasFiles = false;
    const urlProp = getBlockUrlProp(block);
    const blockFiles = getBlockFiles(block);

    if (blockFiles.length || (urlProp && block[urlProp])) {
      hasFiles = true;
    }

    const uppyOptions = {
      id: makeUppyIdForBlock(block, UPPY_ID_SUFFIX),
      restrictions: {
        ...makeRestrictionsForBlock(block, user, {
          storageAdjustment,
        }),
        minNumberOfFiles: hasFiles ? 0 : 1,
      },
    };

    const uppyMeta = {
      uploaderUid: user.uid,
      uploaderWbid: user.wbid,
    };

    this.uppy.setOptions(uppyOptions);
    this.uppy.setMeta(uppyMeta);
  }

  handleClickNew = () => {
    const wb = utils.book_new();
    wb.Props = {
      Title: "New Sheet",
      Subject: "Test",
      Author: "Whatboard System",
      CreatedDate: new Date(),
    };

    wb.SheetNames.push("Sheet1");
    const wsData = [["hello", "world"]];
    const ws = utils.aoa_to_sheet(wsData, { sheetStubs: true });
    wb.Sheets.Sheet1 = ws;

    const wbout = write(wb, { bookType: "xlsx", type: "binary" });
    function s2ab(s) {
      const buf = new ArrayBuffer(s.length);
      const view = new Uint8Array(buf);
      // eslint-disable-next-line no-bitwise
      for (let i = 0; i < s.length; i += 1) view[i] = s.charCodeAt(i) & 0xff;
      return buf;
    }

    this.uppy.addFile({
      source: "file input",
      name: "sample.csv",
      type: "text/csv",
      data: new Blob([s2ab(wbout)], { type: "application/octet-stream" }),
    });
  };

  render() {
    const { storageAdjustment, loadingStorageAdjustment } = this.state;
    const { type, block } = this.props;

    return (
      <>
        <UserStorageUsage
          adjust={storageAdjustment}
          loading={
            loadingStorageAdjustment ? "Calculating Storage Usage..." : ""
          }
        />
        <div className="upload-wrapper">
          {type === BlockTypes.Grid && block.isNew && (
            // eslint-disable-next-line
            <div className="blank-grid" onClick={this.handleClickNew}>
              <span>Blank Grid</span>
            </div>
          )}
          <Dashboard
            id={`${this.uppyId}:DashboardModal`}
            uppy={this.uppy}
            width="100%"
            height="350px"
            locale={{
              strings: {
                // Used as the label for the button that starts an upload.
                uploadXFiles: {
                  0: "Select %{smart_count} file",
                  1: "Select %{smart_count} files",
                },
                // Used as the label for the button that starts an upload, if another upload has been started in the past
                // and new files were added later.
                uploadXNewFiles: {
                  0: "Select +%{smart_count} file",
                  1: "Select +%{smart_count} files",
                },
              },
            }}
          />
        </div>
      </>
    );
  }
}

FileUploadButton.contextType = UserContext;

FileUploadButton.defaultProps = {
  block: {},
};
