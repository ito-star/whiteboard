import PropTypes from "prop-types";
import React, { useEffect } from "react";
import ReactQuill from "react-quill";
import Quill from "quill";
import Uppy from "@uppy/core";
import { useUppy } from "@uppy/react";
import BlotFormatter from "quill-blot-formatter";
import UppyFirebase from "../UppyFirebase";
import QuillToolbar from "../QuillToolbar";
import CustomImage from "./CustomImage";
import QuillUppy from "../QuillUppy";
import useUser from "../auth/useUser";
import {
  getEditorFormats,
  getEditorModules,
  initFirebase,
  withHttp,
} from "../utils";
import {
  makeUppyIdForBlock,
  getCommonOptions,
  makeRestrictionsForBlock,
  makeUploadFolderForBlock,
} from "../uppy";
// import UserStorageUsage from "../User/UserStorageUsage";
// import useCalcStorageAdjustment from "../useCalcStorageAdjustment";

import "react-quill/dist/quill.snow.css";

initFirebase();

const Link = Quill.import("formats/link");
const Size = Quill.import("attributors/style/size");
const Font = Quill.import("formats/font");

const oldSanitize = Link.sanitize;
// eslint-disable-next-line func-names
Link.sanitize = function (url) {
  // quill by default creates relative links if scheme is missing.
  const linkified = withHttp(url);
  return oldSanitize.call(this, linkified);
};
Size.whitelist = [
  "8px",
  "10px",
  false,
  "14px",
  "18px",
  "22px",
  "24px",
  "28px",
  "32px",
  "38px",
];
Font.whitelist = [
  "arial",
  "comic-sans",
  "courier-new",
  "georgia",
  "helvetica",
  "lucida",
  "oswald",
  "francoisone",
  "ibmplexsans",
  "roboto",
  "arimo",
];
Quill.register(Font, true);
Quill.register(Size, true);

Quill.register("modules/blotFormatter", BlotFormatter);
Quill.register("modules/uppy", QuillUppy);
Quill.register({
  "formats/image": CustomImage,
});
const UPPY_ID_SUFFIX = "text-editor";

const TextEditor = React.forwardRef(function TextEditor(props, ref) {
  const {
    block,
    theme,
    formats,
    modules,
    onUploadSuccess: onUploadSuccessProp,
    ...otherQillProps
  } = props;
  const { user } = useUser();
  // const storageAdjustmentState = useCalcStorageAdjustment(block);
  // const storageAdjustment = storageAdjustmentState.value || 0;
  const storageAdjustment = 0;

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

  modules.uppy = {
    uppy,
  };

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
        ...makeRestrictionsForBlock(block, user, {
          storageAdjustment,
        }),
      },
    };

    uppy.setOptions(uppyOptions);
    uppy.getPlugin("UppyFirebase").setOptions({
      folder: makeUploadFolderForBlock(block),
    });
  }, [uppy, block, user, storageAdjustment]);

  useEffect(() => {
    const onComplete = (result) => {
      onUploadSuccessProp(result.successful);
    };

    uppy.on("complete", onComplete);

    return () => {
      uppy.off("complete", onComplete);
    };
  }, [uppy, onUploadSuccessProp]);

  return (
    <>
      <QuillToolbar user={user} />
      <ReactQuill
        ref={ref}
        theme={theme}
        modules={modules}
        formats={formats}
        {...otherQillProps}
        bounds=".html-editor"
      />
      {/* <UserStorageUsage
        adjust={storageAdjustment}
        loading={
          storageAdjustmentState.loading ? "Calculating Storage Usage..." : ""
        }
      /> */}
    </>
  );
});

TextEditor.defaultProps = {
  // eslint-disable-next-line react/default-props-match-prop-types
  theme: "snow",
  // eslint-disable-next-line react/default-props-match-prop-types
  formats: getEditorFormats(),
  // eslint-disable-next-line react/default-props-match-prop-types
  modules: getEditorModules(),
  onUploadSuccess: () => {},
};

TextEditor.propTypes = {
  ...ReactQuill.propTypes,
  block: PropTypes.shape({}).isRequired,
  onUploadSuccess: PropTypes.func,
};

export default TextEditor;
