import styled from "styled-components";

export const SectionTitle = styled.h2`
  font-size: 34px;
  letter-spacing: 0.025em;
  color: ${(props) => props.color || "#0e1959"};
  font-family: AvenirLTStd;
  font-weight: 500;

  @media (max-width: 768px) {
    font-size: 28px;
  }
`;

export const H3 = styled.h3`
  font-size: 35px;
  line-height: 43px;
  letter-spacing: 0.025em;
  color: ${(props) => props.color || "#0e1959"};
  font-family: AvenirLTStd;
  font-weight: 300;
`;

export const H4 = styled.h4`
  font-size: 27px;
  line-height: 39px;
  letter-spacing: 0.025em;
  color: ${(props) => props.color || "#0e1959"};
  font-family: AvenirLTStd;
  font-weight: 300;

  @media (max-width: 768px) {
    font-size: 22px;
    line-height: 30px;
  }
`;

export const H5 = styled.h5`
  font-size: 22px;
  line-height: 29px;
  letter-spacing: 0.025em;
  color: ${(props) => props.color || "#0e1959"};
  font-family: AvenirLTStd;
  font-weight: 300;
`;

export const P = styled.p`
  font-size: 20px;
  line-height: 29px;
  letter-spacing: 0.025em;
  color: ${(props) => props.color || "#363636"};
  font-family: Galatea;
  font-weight: 300;
`;

export const Body1 = styled.p`
  font-size: 18px;
  line-height: 29px;
  color: ${(props) => props.color || "#363636"};
  font-family: Galatea;
  font-weight: 300;
  max-width: ${(props) => props.maxWidth || "unset"};
`;

export const H1 = styled.h1``;
