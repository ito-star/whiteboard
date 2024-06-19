import React from "react";
import { shallow } from "enzyme";
import AuthCheck from "./AuthCheck";
import useUser from "./useUser";

import ComponentToMock from "./__mocks__/ComponentToMock";
import LoadingComponentToMock from "./__mocks__/LoadingComponentToMock";
import VerifyEmailComponentToMock from "./__mocks__/VerifyEmailComponentToMock";
import AccessFallbackComponentToMock from "./__mocks__/AccessFallbackComponentToMock";
import TosCheckComponentToMock from "./__mocks__/TosCheckComponentToMock";

jest.mock("../auth/useUser", () => jest.fn());

describe("AuthCheck component", () => {
  describe("render fallback prop when user is not logged in", () => {
    const authCheckPropTypes = {
      requireVerifiedEmail: true,
      emailFallback: null,
      accessCheck: null,
      accessFallback: null,
      fallback: <ComponentToMock />,
      loading: null,
      allowAnonymous: false,
      children: [<TosCheckComponentToMock />],
    };

    it("render fallback", () => {
      const user = { user: null, loadingUser: false };
      useUser.mockImplementation(() => user);

      const wrapper = shallow(<AuthCheck {...authCheckPropTypes} />);

      expect(wrapper.html()).toBe("<div>A fallback mock passed!</div>");
    });
  });

  describe("render children prop when user is not  logged in and allow Anonymous", () => {
    const authCheckPropTypes = {
      requireVerifiedEmail: true,
      emailFallback: null,
      accessCheck: null,
      accessFallback: null,
      fallback: <ComponentToMock />,
      loading: null,
      allowAnonymous: true,
      children: [<TosCheckComponentToMock />],
    };

    it("render children prop", () => {
      const user = { user: null, loadingUser: false };
      useUser.mockImplementation(() => user);

      const wrapper = shallow(<AuthCheck {...authCheckPropTypes} />);

      expect(wrapper.html()).toBe("<div>A TosCheck mock passed!</div>");
    });
  });

  describe("render loading prop when user is not logged in", () => {
    const authCheckPropTypes = {
      requireVerifiedEmail: true,
      emailFallback: null,
      accessCheck: null,
      accessFallback: null,
      fallback: <ComponentToMock />,
      loading: null,
      allowAnonymous: false,
      children: [<TosCheckComponentToMock />],
    };

    it("render fallback prop if loading prop is null", () => {
      const user = { user: {}, loadingUser: true };
      useUser.mockImplementation(() => user);

      const wrapper = shallow(<AuthCheck {...authCheckPropTypes} />);

      expect(wrapper.html()).toBe("<div>A fallback mock passed!</div>");
    });

    it("render loading prop", () => {
      const user = { user: {}, loadingUser: true };
      useUser.mockImplementation(() => user);

      authCheckPropTypes.loading = <LoadingComponentToMock />;

      const wrapper = shallow(<AuthCheck {...authCheckPropTypes} />);

      expect(wrapper.html()).toBe("<div>A loading mock passed!</div>");
    });
  });

  describe("render props based on user object", () => {
    const authCheckPropTypes = {
      requireVerifiedEmail: false,
      emailFallback: null,
      accessCheck: jest.fn(),
      accessFallback: null,
      fallback: <ComponentToMock />,
      loading: <LoadingComponentToMock />,
      children: [<TosCheckComponentToMock />],
    };

    it("render fallback prop if accessFallback is null", () => {
      const user = {
        user: { email: "johdoe@gmail.com", emailVerified: false },
        loadingUser: false,
      };
      useUser.mockImplementation(() => user);

      const wrapper = shallow(<AuthCheck {...authCheckPropTypes} />);

      expect(wrapper.html()).toBe("<div>A fallback mock passed!</div>");
    });

    it("render access fallback", () => {
      const user = {
        user: { email: "johdoe@gmail.com", emailVerified: false },
        loadingUser: false,
      };
      useUser.mockImplementation(() => user);
      authCheckPropTypes.accessFallback = <AccessFallbackComponentToMock />;

      const wrapper = shallow(<AuthCheck {...authCheckPropTypes} />);

      expect(wrapper.html()).toBe("<div>A access fallback mock passed!</div>");
    });

    it("render verify email fallback", () => {
      const user = {
        user: { email: "johdoe@gmail.com", emailVerified: false },
        loadingUser: false,
      };
      useUser.mockImplementation(() => user);
      authCheckPropTypes.requireVerifiedEmail = true;

      authCheckPropTypes.emailFallback = <VerifyEmailComponentToMock />;

      const wrapper = shallow(<AuthCheck {...authCheckPropTypes} />);

      expect(wrapper.html()).toBe(
        "<div>A verify email fallback mock passed!</div>"
      );
    });

    it("render fallback if emailFallback is null", () => {
      const user = {
        user: {
          email: "johdoe@gmail.com",
          emailVerified: false,
          isAnonymous: true,
        },
        loadingUser: false,
      };
      useUser.mockImplementation(() => user);

      authCheckPropTypes.emailFallback = null;
      authCheckPropTypes.requireVerifiedEmail = true;

      const wrapper = shallow(<AuthCheck {...authCheckPropTypes} />);

      expect(wrapper.html()).toBe("<div>A fallback mock passed!</div>");
    });

    it("render fallback if User object is not null and isAnonymous false", () => {
      const user = {
        user: {
          email: "johdoe@gmail.com",
          emailVerified: true,
          isAnonymous: true,
        },
        loadingUser: false,
      };
      useUser.mockImplementation(() => user);

      authCheckPropTypes.allowAnonymous = false;
      authCheckPropTypes.accessCheck = null;

      const wrapper = shallow(<AuthCheck {...authCheckPropTypes} />);

      expect(wrapper.html()).toBe("<div>A fallback mock passed!</div>");
    });

    it("render fallback if isAnonymous is true and allowAnonymous is false", () => {
      const user = {
        user: {
          email: "johdoe@gmail.com",
          emailVerified: true,
          isAnonymous: true,
        },
        loadingUser: false,
      };
      useUser.mockImplementation(() => user);

      authCheckPropTypes.allowAnonymous = false;
      authCheckPropTypes.accessCheck = null;

      const wrapper = shallow(<AuthCheck {...authCheckPropTypes} />);

      expect(wrapper.html()).toBe("<div>A fallback mock passed!</div>");
    });

    it("render children prop", () => {
      const user = {
        user: {
          email: "johdoe@gmail.com",
          emailVerified: true,
          isAnonymous: false,
        },
        loadingUser: false,
      };
      useUser.mockImplementation(() => user);

      authCheckPropTypes.allowAnonymous = false;
      authCheckPropTypes.accessCheck = null;

      const wrapper = shallow(<AuthCheck {...authCheckPropTypes} />);

      expect(wrapper.html()).toBe("<div>A TosCheck mock passed!</div>");
    });
  });
});
