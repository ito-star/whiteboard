import React from "react";
import Uppy from "@uppy/core";
import { Button } from "@material-ui/core";
import { useUppy, Dashboard } from "@uppy/react";
import getFileNameAndExtension from "@uppy/utils/lib/getFileNameAndExtension";
import ImageEditor from "@uppy/image-editor";
import firebase from "firebase/compat/app";
import "firebase/compat/storage";
import { useConfirm } from "material-ui-confirm";
import { initFirebase, getBrandImageUrl } from "../utils";
import { getCommonOptions, makeUppyIdForBoard } from "../uppy";
import Stack from "../components/Stack";
import useUser from "../auth/useUser";
import UppyFirebase from "../UppyFirebase";
import access from "../access";
import AuthCheck from "../auth/AuthCheck";
import UpgradeOffer from "../User/UpgradeOffer";

import "@uppy/core/dist/style.css";
import "@uppy/dashboard/dist/style.css";
import "@uppy/image-editor/dist/style.css";
import "./BrandUploader.scss";

initFirebase();

const UPPY_ID_SUFFIX = "branding";

const BrandUploader = () => {
  const { user } = useUser();
  const confirm = useConfirm();
  const [loading, setLoading] = React.useState(false);
  const [editMode, setEditMode] = React.useState(false);
  const [brandImageUrl, setBrandImageUrl] = React.useState(null);
  const storageUri = `users/${user.wbid}/brand_image.png`;
  const uppy = useUppy(() => {
    const uppyOptions = {
      ...getCommonOptions(),
      id: makeUppyIdForBoard(user.wbid, UPPY_ID_SUFFIX),
      restrictions: {
        maxNumberOfFiles: 1,
        allowedFileTypes: ["image/png"],
      },
      meta: {
        uniqueFileName: false,
      },
      onBeforeFileAdded: (currentFile) => {
        const file = {
          ...currentFile,
        };

        file.name = "brand_image.png";
        file.meta.name = file.name;
        file.extension = getFileNameAndExtension(file.name).extension;

        return file;
      },
    };

    const uppyInstance = new Uppy(uppyOptions);

    uppyInstance.use(UppyFirebase, {
      metaFields: ["uploaderUid", "uploaderWbid"],
      folder: `/users/${user.wbid}`,
    });

    uppyInstance.use(ImageEditor, {
      quality: 0.8,
      cropperOptions: {
        viewMode: 1,
        background: false,
        autoCropArea: 1,
        responsive: true,
        initialAspectRatio: 200 / 60,
        croppedCanvasOptions: {},
      },
      actions: {
        revert: true,
        rotate: true,
        granularRotate: true,
        flip: true,
        zoomIn: true,
        zoomOut: true,
        cropSquare: true,
        cropWidescreen: true,
        cropWidescreenVertical: true,
      },
    });

    return uppyInstance;
  });

  React.useEffect(() => {
    if (uppy) {
      uppy.setMeta({
        uploaderUid: user.uid,
        uploaderWbid: user.wbid,
      });

      uppy.getPlugin("UppyFirebase")?.setOptions({
        folder: `/users/${user.wbid}`,
      });
    }
  }, [uppy, user.uid, user.wbid]);

  const fetchBrandImageUrl = React.useCallback(async () => {
    setLoading(true);
    const url = await getBrandImageUrl(user.wbid);
    setBrandImageUrl(url);
    setLoading(false);
  }, [setBrandImageUrl, user.wbid]);

  React.useEffect(() => {
    if (access.canUploadBrandingImage(user)) {
      fetchBrandImageUrl();
    }
  }, [fetchBrandImageUrl, user]);

  React.useEffect(() => {
    const onComplete = (result) => {
      if (result.successful.length) {
        uppy.reset();
        fetchBrandImageUrl();
        setEditMode(false);
      }
    };

    if (uppy) {
      uppy.on("complete", onComplete);
    }

    return () => {
      uppy.off("complete", onComplete);
    };
  }, [uppy, fetchBrandImageUrl]);

  const handleClickDelete = () => {
    confirm({
      title: "Are you sure that you want to delete this brand image?",
      confirmationText: "Delete",
    })
      .then(async () => {
        await firebase.storage().ref(storageUri).delete();
        setBrandImageUrl(null);
      })
      .catch(() => null);
  };

  const accessFallback = (
    <UpgradeOffer
      prefix="Want to upload your own branding image?"
      targetRole="premium-plus"
    />
  );

  return (
    <AuthCheck
      accessCheck={access.canUploadBrandingImage}
      accessFallback={accessFallback}
    >
      <div className="brand-uploader">
        <div style={{ display: editMode ? "block" : "none" }}>
          <Dashboard
            uppy={uppy}
            plugins={["ImageEditor"]}
            autoOpenFileEditor
            note="Images must be in PNG format. Looks best at: 200 x 60 pixels"
          />
        </div>
        {!editMode && (
          <div className="preview-view">
            <img
              src={loading ? undefined : brandImageUrl || "/power-icon.png"}
              alt="brand-logo"
            />
            <Stack direction="row" spacing={2}>
              {brandImageUrl && (
                <Button className="cancel-button" onClick={handleClickDelete}>
                  Delete
                </Button>
              )}
              <Button
                className="confirm-button"
                onClick={() => setEditMode(true)}
              >
                Edit
              </Button>
            </Stack>
          </div>
        )}
      </div>
    </AuthCheck>
  );
};

export default BrandUploader;
