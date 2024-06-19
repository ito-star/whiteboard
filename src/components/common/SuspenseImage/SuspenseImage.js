import React from "react";
import loadImage from "./loadImage";

const SuspenseImage = (props) => {
  const { src, alt, ...restProps } = props;
  loadImage(src).read();
  return <img src={src} alt={alt} {...restProps} />;
};

export default SuspenseImage;
