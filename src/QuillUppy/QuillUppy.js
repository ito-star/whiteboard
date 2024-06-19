import { Uppy } from "@uppy/core";
import Dashboard from "@uppy/dashboard";

import "@uppy/core/dist/style.css";
import "@uppy/dashboard/dist/style.css";

class QuillUppy {
  /**
   * Default coniguration options
   */
  static DEFAULTS = {
    /**
     * An Uppy instance
     *
     * This module automatically adds the Dashboard plugin. Do not
     * add it yourself. You can configure the Dashboard plugin using
     * the `dashboardOpts` configuration option of this module.
     *
     * @type {Uppy}
     */
    uppy: null,
    /**
     * Allowed MIME types (or file extensions) for image files
     *
     * @see {@link https://uppy.io/docs/uppy/#restrictions} for details on the exact format of this option.
     *      Specifically, the `allowedFileTypes` restriction.
     */
    allowedImageTypes: ["image/gif", "image/jpeg", "image/png", "image/webp"],
    /**
     * Configuration options for the Uppy Dashboard Plugin
     *
     * This module automatically adds the Dashboard plugin to the
     * Uppy instance specified by the `uppy` option. These options
     * will be used to configure the Dashboard plugin.
     *
     * @see {@link https://uppy.io/docs/dashboard/#Options}
     */
    dashboardOpts: {
      id: "Dashboard",
      inline: false,
      trigger: false,
      closeModalOnClickOutside: true,
      closeAfterFinish: true,
    },
  };

  constructor(quill, options) {
    this.quill = quill;
    this.container = this.quill.addContainer("ql-uppy");
    this.options = {
      ...QuillUppy.DEFAULTS,
      ...options,
      dashboardOpts: {
        ...QuillUppy.DEFAULTS.dashboardOpts,
        ...options.dashboardOpts,
        target: this.container,
      },
    };

    const { uppy, dashboardOpts } = this.options;

    if (!(uppy instanceof Uppy)) {
      throw new Error("Uppy instance required");
    }

    uppy.use(Dashboard, dashboardOpts);
    uppy.on("upload-success", this.uploadSuccessHandler);
    uppy.on("complete", this.completeHandler);

    const toolbar = this.quill.getModule("toolbar");
    toolbar.addHandler("image", this.imageHandler);
  }

  /**
   * @returns {Uppy}
   */
  get uppy() {
    return this.options.uppy;
  }

  /**
   * @return {Dashboard}
   */
  get dashboard() {
    return this.uppy.getPlugin(this.options.dashboardOpts.id);
  }

  imageHandler = () => {
    this.uppy.setOptions({
      restrictions: {
        allowedFileTypes: this.options.allowedImageTypes,
      },
    });
    this.dashboard.openModal();
  };

  uploadSuccessHandler = (file, response) => {
    this.quill.insertEmbed(
      this.quill.getSelection(true),
      "image",
      response.uploadURL
    );

    this.quill.setSelection(this.quill.getSelection(true).index + 1);
  };

  completeHandler = (result) => {
    const { failed } = result;
    const { closeAfterFinish } = this.dashboard.opts;

    if (closeAfterFinish && failed.length === 0) {
      this.uppy.reset();
    }
  };
}

export default QuillUppy;
