import React from "react";
import PropTypes from "prop-types";
import _orderBy from "lodash/orderBy";
import { List } from "@material-ui/core";
import "./FileList.scss";
import { makeCaseInsensitiveIteratee, makeDateTimeIteratee } from "../utils";
import FileListItem from "./FileListItem";

const FileList = ({
  files,
  isRemovable,
  isPopout,
  handlePopoutFile,
  handleRemoveFile,
  orderBy,
  loggedInLastViewed,
}) => {
  let sortedFiles = [];

  if (orderBy && orderBy.length) {
    const iteratees = [];
    const orders = [];

    orderBy.forEach((orderSpec) => {
      let iteratee = orderSpec.prop;
      const order = orderSpec.dir || "asc";

      if (iteratee === "fileName") {
        iteratee = makeCaseInsensitiveIteratee(iteratee);
      } else if (iteratee === "uploadDate") {
        iteratee = makeDateTimeIteratee(iteratee);
      }

      iteratees.push(iteratee);
      orders.push(order);
    });

    sortedFiles = _orderBy(files, iteratees, orders);
  } else {
    sortedFiles = files;
  }

  return (
    <List className="file-list">
      {sortedFiles.map((file, index) => {
        return (
          <FileListItem
            key={file.filePath}
            index={index}
            file={file}
            isRemovable={isRemovable}
            isPopout={isPopout}
            handlePopoutFile={handlePopoutFile}
            handleRemoveFile={handleRemoveFile}
            loggedInLastViewed={loggedInLastViewed}
          />
        );
      })}
    </List>
  );
};

FileList.defaultProps = {
  isRemovable: false,
  isPopout: false,
  handlePopoutFile: () => {},
  handleRemoveFile: () => {},
  orderBy: [],
};

FileList.propTypes = {
  files: PropTypes.arrayOf(PropTypes.object).isRequired,
  isRemovable: PropTypes.bool,
  isPopout: PropTypes.bool,
  handlePopoutFile: PropTypes.func,
  handleRemoveFile: PropTypes.func,
  orderBy: PropTypes.arrayOf(
    PropTypes.shape({
      prop: PropTypes.oneOfType([
        PropTypes.array,
        PropTypes.func,
        PropTypes.object,
        PropTypes.string,
      ]).isRequired,
      dir: PropTypes.oneOf(["asc", "desc"]),
    })
  ),
};

export default FileList;
