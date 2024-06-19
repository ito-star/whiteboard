import React from "react";
import PropTypes from "prop-types";
import SvgIcon from "@material-ui/core/SvgIcon";
import FileDocumentIcon from "mdi-material-ui/FileDocument";
import FileImageIcon from "mdi-material-ui/FileImage";
import FileAudioIcon from "mdi-material-ui/FileMusic";
import FileVideoIcon from "mdi-material-ui/FileVideo";
import FilePdfIcon from "mdi-material-ui/FilePdfBox";
import FileArchiveIcon from "mdi-material-ui/FileCabinet";
import FileCadIcon from "mdi-material-ui/FileCad";
import FileWordIcon from "mdi-material-ui/FileWord";
import FileExcelIcon from "mdi-material-ui/FileExcel";
import FilePowerPointIcon from "mdi-material-ui/FilePowerpoint";

const FileTypeIcon = (props) => {
  const { fileType = "application/octet-stream", ...rest } = props;

  let Icon = FileDocumentIcon;

  if (fileType) {
    const fileTypeGeneral = fileType.split("/")[0];
    const fileTypeSpecific = fileType.split("/")[1];

    switch (fileTypeGeneral) {
      case "image":
        switch (fileTypeSpecific) {
          case "x-dwg":
          case "vnd.dwg":
            Icon = FileCadIcon;
            break;
          default:
            Icon = FileImageIcon;
            break;
        }
        break;
      case "audio":
        Icon = FileAudioIcon;
        break;
      case "video":
        Icon = FileVideoIcon;
        break;
      case "application":
        switch (fileTypeSpecific) {
          case "pdf":
            Icon = FilePdfIcon;
            break;
          case "zip":
          case "x-7z-compressed":
          case "x-rar-compressed":
          case "x-gtar":
          case "x-apple-diskimage":
          case "x-diskcopy":
          case "x-bzip":
          case "x-bzip2":
          case "vnd.rar":
          case "gzip":
            Icon = FileArchiveIcon;
            break;
          case "acad":
          case "x-acad":
          case "dwg":
          case "x-dwg":
          case "x-autocad":
            Icon = FileCadIcon;
            break;
          case "msword":
          case "vnd.openxmlformats-officedocument.wordprocessingml.document":
          case "vnd.oasis.opendocument.text":
            Icon = FileWordIcon;
            break;
          case "vnd.ms-excel":
          case "vnd.openxmlformats-officedocument.spreadsheetml.sheet":
          case "vnd.oasis.opendocument.spreadsheet":
            Icon = FileExcelIcon;
            break;
          case "vnd.ms-powerpoint":
          case "vnd.openxmlformats-officedocument.presentationml.presentation":
          case "vnd.oasis.opendocument.presentation":
            Icon = FilePowerPointIcon;
            break;
          default:
            break;
        }
        break;
      default:
        break;
    }
  }

  return <Icon {...rest} />;
};

FileTypeIcon.propTypes = {
  ...SvgIcon.propTypes,
  // eslint-disable-next-line react/require-default-props
  fileType: PropTypes.string,
};

export default FileTypeIcon;
