import { BasePlugin as UppyPlugin } from "@uppy/core";

/**
 * Uppy File Selector Upload Plugin
 *
 * This is an Uppy Uploader plugin designed for use when using the
 * Uppy Dashboard purely as a file selector
 */
class UppySelectorUploader extends UppyPlugin {
  constructor(uppy, opts) {
    super(uppy, opts);
    this.type = "uploader";
    this.id = opts.id || "UppySelectorUploader";
    this.title = "Selector Uploader";

    const defaultOptions = {};

    this.opts = {
      ...defaultOptions,
      ...opts,
    };

    this.upload = this.upload.bind(this);
  }

  async uploadFile(file, current, total) {
    this.uppy.log(`[UppySelectorUploader] Selecting ${current} of ${total}`);

    return file;
  }

  upload(fileIDs) {
    if (fileIDs.length === 0) {
      this.uppy.log("[UppySelectorUploader] No files selected!");
      return Promise.resolve();
    }

    this.uppy.log("[UppySelectorUploader] Selecting...");

    const promises = fileIDs.map((id, i) => {
      const current = parseInt(i, 10) + 1;
      const total = fileIDs.length;

      const file = this.uppy.getFile(id);

      if (file.error) {
        return Promise.reject(file.error);
      }

      return this.uploadFile(file, current, total);
    });

    return Promise.allSettled(promises);
  }

  install() {
    this.uppy.addUploader(this.upload);
  }

  uninstall() {
    this.uppy.removeUploader(this.upload);
  }
}

export default UppySelectorUploader;
