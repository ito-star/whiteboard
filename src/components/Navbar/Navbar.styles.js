import styled from "styled-components";

export const NavWrapper = styled.nav`
  position: absolute;
  background: transparent;
  width: 100%;
  top: 57px;
  z-index: 1;

  @media (max-width: 768px) {
    top: 35px;
  }
`;

export const NavContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  @media (max-width: 1200px) {
    img {
      width: 180px;
    }
  }
`;

export const NavList = styled.ul`
  display: flex;
  font-family: Galatea;
  font-weight: 400;
  list-style: none;
  letter-spacing: 0.1em;
  margin-bottom: 0;

  @media (max-width: 998px) {
    top: 0;
    right: 0;
    padding: 20px;
    position: fixed;
    flex-direction: column;
    background: #2c387e;
    border: 1px solid white;
    border-right: none;
    box-shadow: rgba(50, 50, 93, 0.25) 0px 50px 100px -20px,
      rgba(0, 0, 0, 0.3) 0px 30px 60px -30px,
      rgba(10, 37, 64, 0.35) 0px -2px 6px 0px inset;
    border-radius: 10px 0 0 10px;
    width: 250px;
    align-items: flex-start;
    transition: 0.3s right ease-in;
    right: ${(props) => (props.open ? "0" : "-252px")};
  }
`;

export const NavListItem = styled.li`
  margin-left: 44px;
  height: 55px;
  line-height: 55px;

  &:first-child {
    margin-left: 0;
  }

  @media (max-width: 998px) {
    margin-left: 0;
    height: 50px;
    line-height: 50px;
  }

  ${(props) =>
    props.rounded &&
    `
    border-radius: 28px;
    border: 1px solid #3e50b6;
    padding: 0 36px;

    @media (max-width: 998px) {
      margin-top: 18px;
    }
  }

    &:nth-child(4) {
      margin-left: 70px;
      @media (max-width: 998px) {
        margin-left: 0;
      }
    }
    &:last-child {
      margin-left: 20px;
      @media (max-width: 992px) {
        margin-left: 0;
      }
    }
  `}

  a {
    color: #e1e1e1;
    white-space: nowrap;

    &:hover {
      color: #ffffff;
    }
  }
`;
