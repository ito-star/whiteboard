import {
  DeleteAction,
  ResizeAction,
  AlignAction,
  ImageSpec,
} from "quill-blot-formatter";

export default class QuillImageBlotSpec extends ImageSpec {
  getActions() {
    return [DeleteAction, ResizeAction, AlignAction];
  }

  init() {
    this.formatter.quill.root.addEventListener("click", this.onClick);

    // handling scroll event
    this.formatter.quill.root.addEventListener("scroll", () => {
      this.formatter.repositionOverlay();
    });

    // handling align
    this.formatter.quill.on("editor-change", (eventName, ...args) => {
      if (eventName === "selection-change" && args[2] === "api") {
        setTimeout(() => {
          this.formatter.repositionOverlay();
        }, 10);
      }
    });
  }
}
