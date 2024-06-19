import firebase from "firebase/compat/app";
import "firebase/compat/storage";

class FirebaseStorageUploader {
  constructor(file, ref, options = {}) {
    const defaultOptions = {
      metadata: {},
      onStateChanged() {},
      onError() {},
      onComplete() {},
    };

    this.options = {
      ...defaultOptions,
      ...options,
    };

    this.file = file;
    this.ref = ref;
    this.uploadTask = null;
    this.isPaused = false;
  }

  createUpload() {
    this.uploadTask = this.ref.put(this.file.data, this.options.metadata);
    this.uploadTask.on(
      firebase.storage.TaskEvent.STATE_CHANGED,
      this.options.onStateChanged,
      this.options.onError,
      () => {
        this.options.onComplete(this.uploadTask);
      }
    );
  }

  resumeUpload() {
    if (this.uploadTask) {
      this.uploadTask.resume();
    }
  }

  abortUpload() {
    if (this.uploadTask) {
      this.uploadTask.cancel();
    }
  }

  start() {
    this.isPaused = false;

    if (this.uploadTask) {
      this.resumeUpload();
    } else {
      this.createUpload();
    }
  }

  pause() {
    if (this.uploadTask) {
      this.uploadTask.pause();
    }

    this.isPaused = true;
  }

  abort(opts = {}) {
    const really = opts.really || false;

    if (!really) {
      this.pause();
    }

    this.abortUpload();
  }
}

export default FirebaseStorageUploader;
