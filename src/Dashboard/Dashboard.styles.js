import styled from "styled-components";
import Loader from "../components/Loader";
import { headerFont } from "../theme/theme.module.scss";

export const CreatingBoardLoader = styled(Loader).attrs({
  width: "48px",
  height: "48px",
  type: "cylon",
  isFullScreen: true,
})`
  background-color: #fff;
`;

export const CreatingBoardLoaderText = styled.h1`
  font-weight: 400;
  text-align: center;
  font-size: 20px;
  font-family: ${headerFont};
`;
