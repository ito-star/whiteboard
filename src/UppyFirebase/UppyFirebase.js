import { BasePlugin as UppyPlugin } from "@uppy/core";
import EventTracker from "@uppy/utils/lib/EventTracker";
import { RateLimitedQueue } from "@uppy/utils/lib/RateLimitedQueue";
import firebase from "firebase/compat/app";
import "firebase/compat/storage";
import FirebaseStorageUploader from "../FirebaseStorageUploader";
import { modifyFileName } from "../utils";

class UppyFirebase extends UppyPlugin {
  constructor(uppy, opts) {
    super(uppy, opts);
    this.type = "uploader";
    this.id = opts.id || "UppyFirebase";
    this.title = "Firebase Storage";

    const defaultOptions = {
      timeout: 30 * 1000,
      limit: 0,
      retryDelays: [0, 1000, 3000, 5000],
      storageBucket: null,
      folder: "/",
      metaFields: [],
    };

    this.opts = {
      ...defaultOptions,
      ...opts,
    };

    this.fbStorageInit();

    this.upload = this.upload.bind(this);

    this.requests = new RateLimitedQueue(this.opts.limit);

    this.uploaders = Object.create(null);
    this.uploaderEvents = Object.create(null);
  }

  setOptions(newOpts) {
    super.setOptions(newOpts);
    this.fbStorageInit();
  }

  fbStorageInit() {
    if (!this.opts.storageBucket) {
      this.fbStorage = firebase.storage().ref();
    } else {
      this.fbStorage = firebase.storage(this.opts.storageBucket).ref();
    }

    this.opts.folder = this.cleanRefName(this.opts.folder);
  }

  cleanRefName(path) {
    return path
      .trim()
      .replace(/^\//, "")
      .replace(/\/$/, "")
      .replace(/[#[\]*?]/g, "");
  }

  /**
   * Clean up all references for a file's upload: the UppyFirebase instance,
   * any events related to the file
   *
   * Set `opts.abort` to tell Firebase that the upload is cancelled and must be removed.
   * This should be done when the user cancels the upload, not when the upload is completed or errored.
   */
  resetUploaderReferences(fileID, opts = {}) {
    if (this.uploaders[fileID]) {
      this.uploaders[fileID].abort({ really: opts.abort || false });
      this.uploaders[fileID] = null;
    }

    if (this.uploaderEvents[fileID]) {
      this.uploaderEvents[fileID].remove();
      this.uploaderEvents[fileID] = null;
    }
  }

  getUploadPath(file) {
    let uniqueFileName = true;

    if (file.meta.uniqueFileName === false) {
      uniqueFileName = false;
    }

    let newFileName = file.name;

    if (uniqueFileName) {
      newFileName = modifyFileName(newFileName, modifyFileName.appendUUID);
    }

    const cleanName = this.cleanRefName(newFileName);
    const uploadPath = `${this.opts.folder}/${cleanName}`;

    return uploadPath;
  }

  uploadFile(file, current, total) {
    this.uppy.log(`[UppyFirebase] Uploading ${current} of ${total}`);

    return new Promise((resolve, reject) => {
      const fullPath = this.getUploadPath(file);
      const fbRef = this.fbStorage.root.child(fullPath);

      const metadata = {
        contentType: file.type,
        customMetadata: {
          originalFileName: file.name,
        },
      };

      this.opts.metaFields.forEach((key) => {
        if (file.meta[key] != null) {
          metadata.customMetadata[key] = file.meta[key].toString();
        }
      });

      let queuedRequest;
      let upload;

      const onStateChanged = (snapshot) => {
        this.uppy.emit("upload-progress", file, {
          uploader: this,
          bytesUploaded: snapshot.bytesTransferred,
          bytesTotal: snapshot.totalBytes,
        });

        switch (snapshot.state) {
          case firebase.storage.TaskState.PAUSED: // or 'paused'
            this.uppy.log(`[UppyFirebase] Upload ${file.id} paused`);
            break;
          case firebase.storage.TaskState.RUNNING: // or 'running'
            this.uppy.log(`[UppyFirebase] Upload ${file.id} running`);
            break;
          default:
            break;
        }
      };

      const onError = (error) => {
        this.uppy.log(error);

        try {
          this.uppy.emit("upload-error", file, error);
        } catch (e) {
          // Do nothing
        }

        queuedRequest.done();
        this.resetUploaderReferences(file.id);
        reject(error);
      };

      const onComplete = (uploadTask) => {
        uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
          const uploadResp = {
            uploadTask,
            uploadURL: downloadURL,
          };

          queuedRequest.done();
          this.resetUploaderReferences(file.id);

          this.uppy.emit("upload-success", file, uploadResp);

          if (downloadURL) {
            this.uppy.log(
              `[UppyFirebase] Download ${uploadTask.snapshot.ref.name} from ${downloadURL}`
            );
          }

          resolve(upload);
        });
      };

      upload = new FirebaseStorageUploader(file, fbRef, {
        metadata,
        onStateChanged,
        onError,
        onComplete,
      });

      this.uploaders[file.id] = upload;
      this.uploaderEvents[file.id] = new EventTracker(this.uppy);

      queuedRequest = this.requests.run(() => {
        if (!file.isPaused) {
          upload.start();
        }
        // Don't do anything here, the caller will take care of cancelling the upload itself
        // using resetUploaderReferences(). This is because resetUploaderReferences() has to be
        // called when this request is still in the queue, and has not been started yet, too. At
        // that point this cancellation function is not going to be called.
        return () => {};
      });

      this.onFileRemove(file.id, (removed) => {
        queuedRequest.abort();
        this.resetUploaderReferences(file.id, { abort: true });
        resolve(`Upload ${removed.id} was removed`);
      });

      this.onCancelAll(file.id, () => {
        queuedRequest.abort();
        this.resetUploaderReferences(file.id, { abort: true });
        resolve(`Upload ${file.id} was canceled`);
      });

      this.onFilePause(file.id, (isPaused) => {
        if (isPaused) {
          // Remove this file from the queue so another file can start in its place.
          queuedRequest.abort();
          upload.pause();
        } else {
          // Resuming an upload should be queued, else you could pause and then resume a queued upload to make it skip the queue.
          queuedRequest.abort();
          queuedRequest = this.requests.run(() => {
            upload.start();
            return () => {};
          });
        }
      });

      this.onPauseAll(file.id, () => {
        queuedRequest.abort();
        upload.pause();
      });

      this.onResumeAll(file.id, () => {
        queuedRequest.abort();

        if (file.error) {
          upload.abort();
        }

        queuedRequest = this.requests.run(() => {
          upload.start();
          return () => {};
        });
      });

      // Don't double-emit upload-started for Golden Retriever-restored files that were already started
      if (!file.progress.uploadStarted || !file.isRestored) {
        this.uppy.emit("upload-started", file, upload);
      }
    });
  }

  uploadRemote(file, current, total) {
    this.uppy.log(`[UppyFirebase] Uploading ${current} of ${total}`);

    return new Promise((resolve, reject) => {
      reject(
        new Error("[UppyFirebase] Remote files are not supported at this time.")
      );
    });
  }

  upload(fileIDs) {
    if (fileIDs.length === 0) {
      this.uppy.log("[UppyFirebase] No files to upload!");
      return Promise.resolve();
    }

    this.uppy.log("[UppyFirebase] Uploading...");

    const promises = fileIDs.map((id, i) => {
      const current = parseInt(i, 10) + 1;
      const total = fileIDs.length;

      const file = this.uppy.getFile(id);

      if (file.error) {
        return Promise.reject(file.error);
      }

      if (file.isRemote) {
        return this.uploadRemote(file, current, total);
      }

      return this.uploadFile(file, current, total);
    });

    return Promise.allSettled(promises);
  }

  onFileRemove(fileID, cb) {
    this.uploaderEvents[fileID].on("file-removed", (file) => {
      if (fileID === file.id) {
        cb(file.id);
      }
    });
  }

  onFilePause(fileID, cb) {
    this.uploaderEvents[fileID].on("upload-pause", (targetFileID, isPaused) => {
      if (fileID === targetFileID) {
        // const isPaused = this.uppy.pauseResume(fileID)
        cb(isPaused);
      }
    });
  }

  onRetry(fileID, cb) {
    this.uploaderEvents[fileID].on("upload-retry", (targetFileID) => {
      if (fileID === targetFileID) {
        cb();
      }
    });
  }

  onRetryAll(fileID, cb) {
    this.uploaderEvents[fileID].on("retry-all", () => {
      if (!this.uppy.getFile(fileID)) {
        return;
      }

      cb();
    });
  }

  onPauseAll(fileID, cb) {
    this.uploaderEvents[fileID].on("pause-all", () => {
      if (!this.uppy.getFile(fileID)) {
        return;
      }

      cb();
    });
  }

  onCancelAll(fileID, cb) {
    this.uploaderEvents[fileID].on("cancel-all", () => {
      if (!this.uppy.getFile(fileID)) {
        return;
      }

      cb();
    });
  }

  onResumeAll(fileID, cb) {
    this.uploaderEvents[fileID].on("resume-all", () => {
      if (!this.uppy.getFile(fileID)) {
        return;
      }

      cb();
    });
  }

  install() {
    const { capabilities } = this.uppy.getState();

    this.uppy.setState({
      capabilities: {
        ...capabilities,
        resumableUploads: true,
      },
    });

    this.uppy.addUploader(this.upload);
  }

  uninstall() {
    const { capabilities } = this.uppy.getState();

    this.uppy.setState({
      capabilities: {
        ...capabilities,
        resumableUploads: false,
      },
    });

    this.uppy.removeUploader(this.upload);
  }
}

export default UppyFirebase;
