import styled from "styled-components";

export const Wrapper = styled.footer`
  padding-top: 44px;
`;

export const NavList = styled.ul`
  display: flex;
  flex-direction: column;
  list-style: none;
  padding-left: 0;
  margin-bottom: 0;

  li {
    margin: 8px 0;
    font-family: Galatea;
    font-weight: 400;
    font-size: 16px;

    a {
      text-decoration: none;
      color: #273174;
    }
  }
`;

export const FormTitle = styled.h6`
  font-size: 16px;
  color: #273174;
  font-weight: 700;
  font-family: Galatea;
  letter-spacing: 0.14em;
  margin-bottom: 14px;
`;

export const FormDescription = styled.p`
  font-size: 16px;
  color: #273174;
  font-weight: 300;
  font-family: Galatea;
  letter-spacing: 0.05em;
  margin-bottom: 14px;
`;

export const FormWrapper = styled.form`
  display: flex;

  input {
    flex: 1;
  }
`;

export const CopyrightBar = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
  height: 84px;
  border-top: 1px solid #b9b9b9;
  align-items: center;

  .copyright-text {
    font-size: 16px;
    line-height: 21px;
    letter-spacing: 0.05em;
    color: #273174;
    font-family: AvenirLTStd;
  }

  @media (max-width: 768px) {
    margin-top: 40px;
  }
`;

export const SocialIcons = styled.div`
  display: flex;
  padding-right: 16px;
  gap: 12px;
`;

export const SupportButton = styled.button`
  border: none;
  background-color: transparent;
  color: #273174;
  padding: 0;
`;
