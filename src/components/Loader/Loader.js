import React from "react";
import ReactLoading from "react-loading";
import styled, { css } from "styled-components";

const LoadingWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.15);
  flex-direction: column;

  ${(props) =>
    props.isFullScreen &&
    css`
      position: fixed;
      z-index: 9999;
    `}
`;

const Loader = ({
  id = "app-loader",
  type = "bars",
  color = "#2c387e",
  width,
  height,
  delay,
  hasOverlay = true,
  isFullScreen = false,
  className,
  children,
}) => {
  const Wrapper = hasOverlay ? LoadingWrapper : "div";

  const wrapperProps = {
    className,
  };

  if (hasOverlay) {
    wrapperProps.isFullScreen = isFullScreen;
  }

  return (
    <Wrapper {...wrapperProps}>
      {children}
      <ReactLoading
        id={id}
        className="react-loading"
        type={type}
        color={color}
        width={width}
        height={height}
        delay={delay}
      />
    </Wrapper>
  );
};

export default Loader;
