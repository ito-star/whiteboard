import React from "react";
import { shallow } from "enzyme";
import { renderHook, act } from "@testing-library/react-hooks";
import firebase from "firebase/compat/app";
import "firebase/compat/database";
import useUser from "../auth/useUser";
import { TosCheck, useLoadingUserTos } from "./TosCheck";
import Loader from "../components/Loader";

import AccountPageToMock from "./__mocks__/AccountPageToMock";

jest.mock("../auth/useUser", () => jest.fn());

jest.mock("babel-loader!mdx-loader!../tos/terms-of-service.mdx", () => ({
  frontMatter: { lastUpdated: "tpday" },
}));
jest.mock("babel-loader!mdx-loader!../tos/acceptable-use-policy.mdx", () => ({
  frontMatter: { lastUpdated: "tpday" },
}));
jest.mock("babel-loader!mdx-loader!../tos/privacy-policy.mdx", () => ({
  frontMatter: { lastUpdated: "tpday" },
}));
jest.mock("../utils", () => ({
  initFirebase: jest.fn(),
  scrollToRefObject: jest.fn(),
  mbToBytes: jest.fn(),
  createUUID: jest.fn(),
}));

// jest.mock("firebase");
jest.mock("firebase/compat/app");
jest.mock("firebase/compat/database");

describe("TosCheck", () => {
  const userData = {
    user: {
      wbid: "johndoes@gmail.com",
      uid: "W211SxVXAEhvmWBmn0nwi1WI8wT2",
      isAnonymous: false,
      email: "johndoes@gmail.com",
      emailVerified: true,
      displayName: "John Doe",
      photoURL: "https://lh3.googleusercontent.com/-0xxalooz21s/AAA",
      token: { claims: { isSpecial: false } },
      usage: { boards: 0 },
    },
  };
  const mockFn = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    useUser.mockImplementation(() => userData);
  });

  const defaultProps = {
    loading: <Loader isFullScreen />,
    children: [<AccountPageToMock />],
  };

  describe("with props", () => {
    it("render default", () => {
      const component = shallow(<TosCheck {...defaultProps} />);

      expect(component).toMatchSnapshot();
    });

    it("render error", () => {
      const setLoading = mockFn;
      const setError = mockFn;
      const setAlerts = mockFn;
      const setUserTos = mockFn;
      const setTabValue = mockFn;
      const alerts = [{ props: {}, content: "Error Displayed", alertId: "34" }];
      const working = {};
      const setWorking = mockFn;

      jest
        .spyOn(React, "useState")
        .mockImplementationOnce(() => [false, setLoading])
        .mockImplementationOnce(() => [true, setError])
        .mockImplementationOnce(() => [{}, setUserTos])
        .mockImplementationOnce(() => ["1", setTabValue])
        .mockImplementationOnce(() => [alerts, setAlerts])
        .mockImplementationOnce(() => [working, setWorking]);

      const component = shallow(<TosCheck {...defaultProps} />);

      expect(component.find("Alert").get(0).type.displayName).toBe("Alert");
      expect(component.find("Alert").get(0).type.Link.displayName).toBe(
        "AlertLink"
      );
      expect(component.find("Alert").get(0).type.Heading.displayName).toBe(
        "AlertHeading"
      );
      expect(component.find("Alert").get(0).type.defaultProps.show).toBe(true);
      expect(
        component.find("Alert").get(0).type.defaultProps.transition.defaultProps
      ).toStrictEqual({
        in: false,
        timeout: 300,
        mountOnEnter: false,
        unmountOnExit: false,
        appear: false,
      });
      expect(
        component.find("Alert").get(0).type.defaultProps.transition.displayName
      ).toBe("Fade");
      expect(component.find("Alert").get(0).type.defaultProps.closeLabel).toBe(
        "Close alert"
      );
      expect(component.find("Alert").get(0).props.dismissible).toBe(true);
      expect(component.find("Alert").get(0).props.show).toBe(true);
      expect(component.find("Alert").get(0).props.children).toBe(
        "Error Displayed"
      );
      expect(component.find("Alert").get(0).props.closeLabel).toBe(
        "Close alert"
      );
      component.find("Alert").get(0).props.onClose();

      expect(component.find("Alert").get(1).props.variant).toBe("danger");
      expect(component.find("Alert").get(1).props.children).toBe(true);
      expect(component.find("Alert").get(1).props.show).toBe(true);
      expect(component.find("Alert").get(1).props.transition.displayName).toBe(
        "Fade"
      );
      expect(component.find("Alert").get(1).props.variant).toBe("danger");
      expect(component.find("Alert").get(1).props.closeLabel).toBe(
        "Close alert"
      );
    });

    it("render firstTime message", () => {
      const setLoading = mockFn;
      const setError = mockFn;
      const setUserTos = mockFn;
      const setTabValue = mockFn;
      const setAlerts = mockFn;
      const alerts = {};
      const working = {};
      const setWorking = mockFn;
      jest
        .spyOn(React, "useState")
        .mockImplementationOnce(() => [false, setLoading])
        .mockImplementationOnce(() => [false, setError])
        .mockImplementationOnce(() => [{}, setUserTos])
        .mockImplementationOnce(() => ["1", setTabValue])
        .mockImplementationOnce(() => [alerts, setAlerts])
        .mockImplementationOnce(() => [working, setWorking]);

      const component = shallow(<TosCheck {...defaultProps} />);

      expect(component.find("h1").get(0).props).toStrictEqual({
        className: "h3",
        children:
          "In order to proceed, you must accept the following terms of service:",
      });
    });

    it("render terms of service updated message", () => {
      const setLoading = mockFn;
      const setError = mockFn;
      const setUserTos = mockFn;
      const setTabValue = mockFn;
      const setAlerts = mockFn;
      const alerts = {};
      const working = {};
      const setWorking = mockFn;
      jest
        .spyOn(React, "useState")
        .mockImplementationOnce(() => [false, setLoading])
        .mockImplementationOnce(() => [false, setError])
        .mockImplementationOnce(() => [
          { terms: "hello", tosType: "xyz" },
          setUserTos,
        ])
        .mockImplementationOnce(() => ["1", setTabValue])
        .mockImplementationOnce(() => [alerts, setAlerts])
        .mockImplementationOnce(() => [working, setWorking]);

      const component = shallow(<TosCheck {...defaultProps} />);

      expect(component.find("form").props().className).toBe(
        "makeStyles-root-1"
      );
      expect(component.find("h1").get(0).props).toStrictEqual({
        className: "h3",
        children:
          "Our terms of service have been updated. In order to proceed, you must accept the following:",
      });
      expect(component.find("TabContext").props().value).toBe("1");
      expect(
        component.find("WithStyles(ForwardRef(AppBar))").props().position
      ).toBe("static");
      expect(
        component.find("WithStyles(ForwardRef(AppBar))").props().color
      ).toBe("default");
      expect(component.find("ForwardRef(TabList)").props().value).toBe("1");
      component.find("ForwardRef(TabList)").props().onChange();
      expect(component.find("ForwardRef(TabList)").props().indicatorColor).toBe(
        "primary"
      );
      expect(component.find("ForwardRef(TabList)").props().textColor).toBe(
        "primary"
      );
      expect(component.find("ForwardRef(TabList)").props().variant).toBe(
        "fullWidth"
      );
      expect(
        component.find("WithStyles(ForwardRef(Tab))").length
      ).toStrictEqual(3);
      expect(component.find("ReactSwipableView")).toBeTruthy();
      component.find("ReactSwipableView").props().onChangeIndex();
      expect(component.find("WithStyles(ForwardRef(TabPanel))")).toBeTruthy();
      expect(component.find("terms-of-service.mdx")).toBeTruthy();
      expect(component.find("button").props()).toStrictEqual({
        type: "submit",
        className: "confirm-button",
        disabled: undefined,
        children: "Agree",
      });
    });

    it("render children", () => {
      const setLoading = mockFn;
      const setError = mockFn;
      const setUserTos = mockFn;
      const setTabValue = mockFn;
      const setAlerts = mockFn;
      const alerts = {};
      const working = {};
      const setWorking = mockFn;
      jest
        .spyOn(React, "useState")
        .mockImplementationOnce(() => [false, setLoading])
        .mockImplementationOnce(() => [false, setError])
        .mockImplementationOnce(() => [
          { terms: "tpday", acceptableUse: "tpday", privacy: "tpday" },
          setUserTos,
        ])
        .mockImplementationOnce(() => ["1", setTabValue])
        .mockImplementationOnce(() => [alerts, setAlerts])
        .mockImplementationOnce(() => [working, setWorking]);

      const component = shallow(<TosCheck {...defaultProps} />);

      expect(component.find("AccountPageToMock")).toBeTruthy();
    });
  });

  describe("Use effect", () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    /**
     * @todo FIX ME
     *
     * I think something about the refactoring of the Firebase
     * imports messed with the mocks. Unfortunately, I do not
     * know enough about Jest to fix this. -- Aaron
     */
    it.skip("setUserTos when snap exists", async () => {
      const setUserTos = jest.fn();
      const setError = jest.fn();
      const setLoading = jest.fn();

      const val = { user: "mockValue" };
      const snap = {
        exists: () => true,
        val: () => val,
      };

      const once = jest.fn(async () => snap);
      const ref = jest.fn(() => ({ once }));
      firebase.database.mockImplementation(() => ({ ref }));

      await act(async () => {
        renderHook(() => {
          useLoadingUserTos(
            false,
            userData.user,
            setUserTos,
            setError,
            setLoading
          );
        });
      });

      expect(setUserTos).toHaveBeenCalledTimes(1);
      expect(setUserTos).toHaveBeenCalledWith(val);
      expect(setLoading).toHaveBeenCalledTimes(1);
      expect(setLoading).toHaveBeenCalledWith(false);
    });

    /**
     * @todo FIX ME
     *
     * I think something about the refactoring of the Firebase
     * imports messed with the mocks. Unfortunately, I do not
     * know enough about Jest to fix this. -- Aaron
     */
    it.skip("setUserTos when snap does not exists", async () => {
      const setUserTos = jest.fn();
      const setError = jest.fn();
      const setLoading = jest.fn();

      const val = {};
      const snap = {
        exists: () => false,
        val: () => val,
      };

      const once = jest.fn(async () => snap);
      const ref = jest.fn(() => ({ once }));
      firebase.database.mockImplementation(() => ({ ref }));

      await act(async () => {
        renderHook(() => {
          useLoadingUserTos(
            false,
            userData.user,
            setUserTos,
            setError,
            setLoading
          );
        });
      });

      expect(setUserTos).toHaveBeenCalledTimes(1);
      expect(setUserTos).toHaveBeenCalledWith(val);
      expect(setLoading).toHaveBeenCalledTimes(1);
      expect(setLoading).toHaveBeenCalledWith(false);
    });

    /**
     * @todo FIX ME
     *
     * I think something about the refactoring of the Firebase
     * imports messed with the mocks. Unfortunately, I do not
     * know enough about Jest to fix this. -- Aaron
     */
    it.skip("setUserTos when snap does not exists", async () => {
      const setUserTos = jest.fn();
      const setError = jest.fn();
      const setLoading = jest.fn();

      firebase.database.mockImplementation(() => {
        throw Error("error");
      });

      await act(async () => {
        renderHook(() => {
          useLoadingUserTos(
            false,
            userData.user,
            setUserTos,
            setError,
            setLoading
          );
        });
      });

      expect(setError).toHaveBeenCalledTimes(1);
      expect(setError).toHaveBeenCalledWith("error");
      expect(setLoading).toHaveBeenCalledTimes(1);
      expect(setLoading).toHaveBeenCalledWith(false);
    });

    it("loading user is true", async () => {
      const setUserTos = jest.fn();
      const setError = jest.fn();
      const setLoading = jest.fn();

      await act(async () => {
        renderHook(() => {
          useLoadingUserTos(
            true,
            userData.user,
            setUserTos,
            setError,
            setLoading
          );
        });
      });

      expect(setLoading).toHaveBeenCalledTimes(0);
    });
  });
});
