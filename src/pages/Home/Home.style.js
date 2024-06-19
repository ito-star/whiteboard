import styled, { css } from "styled-components";
import { SuspenseImage } from "../../components/common";

export const Header = styled.header`
  position: relative;
  padding-top: 120px;
  min-height: 790px;
`;

export const CopyTitle = styled.h1`
  font-size: 56px;
  line-height: 51px;
  letter-spacing: 0.01em;
  color: ${(props) => props.color || "#fff"};
  font-family: AvenirLTStd;
  font-weight: ${(props) => (props.heavy ? "500" : "400")};
  white-space: nowrap;
  margin-bottom: 20px;

  @media (max-width: 1200px) {
    font-size: 50px;
    line-height: 55px;
  }

  @media (max-width: 768px) {
    font-size: 28px;
    line-height: 26px;
  }
`;

export const HeaderImage = styled(SuspenseImage)`
  transform: translateX(-60px);

  @media (max-width: 1200px) {
    transform: unset;
    width: 100%;
    height: 100%;
  }
`;

export const OverlayImage = styled(SuspenseImage)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 752px;
  z-index: -1;
  width: 100%;

  @media (max-width: 768px) {
    object-fit: cover;
  }
`;

export const ButtonWrapper = styled.div`
  display: flex;
  gap: 18px;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

export const Section2 = styled.div`
  position: relative;
  padding-top: ${(props) => `${props.padding || 50}px`};
  padding-bottom: ${(props) => `${props.padding || 50}px`};
  min-height: ${(props) => props.minHeight || "unset"};

  ${(props) =>
    props.border &&
    css`
      border-top: 1px solid #c2c2c2;
      border-bottom: 1px solid #c2c2c2;
    `}

  ${(props) =>
    props.background &&
    css`
      background-image: url("${props.background}");
      background-size: cover;
      background-position: center;
    `}
`;

export const SectionTitle = styled.h2`
  font-size: 34px;
  letter-spacing: 0.025em;
  color: #0e1959;
  font-family: AvenirLTStd;
  font-weight: 500;
`;

export const ListItem = styled.div`
  font-size: 18px;
  line-height: 26px;
  letter-spacing: 0.025em;
  color: #363636;
  display: flex;
  align-items: flex-start;
  font-family: Galatea;
  font-weight: 300;
  margin-bottom: 16px;

  img {
    margin-top: 6px;
    margin-right: 16px;
  }
`;

export const FeatureList = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 32px;
  align-items: flex-start;

  a {
    @media (max-width: 768px) {
      align-self: center;
    }
  }
`;

export const Section3Description = styled.div`
  font-size: 34px;
  line-height: 45px;
  letter-spacing: 0.025em;
  font-family: AvenirLTStd-Roman;
  color: #0e1059;
  text-align: center;

  @media (max-width: 768px) {
    font-size: 24px;
    line-height: 32px;
  }
`;

export const SupportedFileContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const FileTypeListWrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 32px;
  padding: 50px 0;

  @media (max-width: 1200px) {
    flex-wrap: wrap;
    img {
      width: 18%;
    }
  }

  @media (max-width: 768px) {
    flex-wrap: wrap;

    img {
      width: 30%;
    }
  }
`;

export const TestimonialWrapper = styled.div`
  margin-top: 70px;
  display: flex;
  gap: 32px;
  justify-content: center;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
  }
`;

export const TestimonialCard = styled.div`
  height: 331px;
  width: 357px;
  background: rgba(255, 255, 255, 0.79);
  border-radius: 2px;
  box-shadow: 0px 4px 84px 22px rgba(0, 0, 0, 0.14);
  padding: 38px 0;
  display: flex;
  align-items: center;
  flex-direction: column;
  font-family: Galatea;
  font-weight: 500;

  .description {
    height: 160px;
    display: flex;
    justify-content: center;
    text-align: center;
    max-width: 240px;
    font-size: 19px;
    line-height: 29px;
    letter-spacing: 0.025em;
    align-items: center;
    color: #464646;
  }

  .divider {
    width: 122px;
    height: 1px;
    background: #e4e4e4;
  }

  .name {
    font-size: 23px;
    line-height: 21px;
    color: #273174;
    margin-top: 30px;
    margin-bottom: 10px;
  }

  .title {
    font-size: 16px;
    line-height: 21px;
    color: #636363;
  }
`;

export const FileExchangeImage = styled.img`
  @media (max-width: 1200px) {
    width: 100%;
    height: 100%;
  }
`;

export const SalesImage = styled(SuspenseImage)`
  position: absolute;
  top: 50%;
  left: 0;
  transform: translateY(-50%);

  @media (max-width: 1200px) {
    width: 60%;
  }
`;
