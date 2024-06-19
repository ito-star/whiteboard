import styled, { css } from "styled-components";

const Button = styled.button`
  background: ${(props) => props.bgColor || "#0072ff"};
  color: white;
  border: none;
  padding: 22px 32px;
  border-radius: 2px;
  font-family: Galatea;
  font-weight: 500;
  font-size: 25px;
  line-height: 27px;
  white-space: nowrap;

  ${(props) =>
    props.size === "medium" &&
    css`
      font-size: 15px;
      font-weight: 27px;
      letter-spacing: 0.075em;
      padding: 8px 18px;
    `}
`;

export default Button;
