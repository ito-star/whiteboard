import { Quill } from "react-quill";

const Image = Quill.import("formats/image");

const ATTRIBUTES = ["height", "width", "class", "style", "alt"];

class CustomImage extends Image {
  static create(inProps) {
    let props;

    if (typeof inProps === "string") {
      props = {
        src: inProps,
      };
    } else {
      props = inProps;
    }

    const node = super.create(props.src);

    ATTRIBUTES.forEach((attr) => {
      // eslint-disable-next-line no-unused-expressions
      props[attr] && node.setAttribute(attr, props[attr]);
    });

    return node;
  }

  static formats(domNode) {
    return ATTRIBUTES.reduce((formats, attribute) => {
      const copy = { ...formats };

      if (domNode.hasAttribute(attribute)) {
        copy[attribute] = domNode.getAttribute(attribute);
      }

      return copy;
    }, {});
  }

  static match(url) {
    return super.match(url) || /\.(webp)$/.test(url);
  }

  static value(node) {
    return ATTRIBUTES.reduce(
      (attrs, attribute) => {
        const copy = { ...attrs };

        if (node.hasAttribute(attribute)) {
          copy[attribute] = node.getAttribute(attribute);
        }

        return copy;
      },
      { src: node.getAttribute("src") }
    );
  }

  format(name, value) {
    if (ATTRIBUTES.indexOf(name) > -1) {
      if (value) {
        this.domNode.setAttribute(name, value);
      } else {
        this.domNode.removeAttribute(name);
      }
    } else {
      super.format(name, value);
    }
  }

  detach(...args) {
    this.scroll.emitter.emit("image-removed", this);
    super.detach.apply(this, args);
  }
}

export default CustomImage;
