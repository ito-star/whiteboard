import React from "react";
import { shallow } from "enzyme";
import CheckIcon from "@material-ui/icons/CheckOutlined";
import { renderHook, act } from "@testing-library/react-hooks";
import filesize from "filesize";
import { AccountPage } from "./AccountPage";
import useUserSubscription from "./useUserSubscription";
import usePrices from "./usePrices";
import useUser from "../auth/useUser";
import {
  getUserSubscription,
  getPrices,
  getCustomerPortalUrl,
  getSubscriptionPlans,
} from "../stripe";
import { getRoles } from "../access";

jest.mock("../auth/useUser", () => jest.fn());

jest.mock("../stripe", () => ({
  getUserSubscription: jest.fn(),
  startSubscription: jest.fn(),
  getPrices: jest.fn(),
  getCustomerPortalUrl: jest.fn(),
  getSubscriptionPlans: jest.fn(),
}));

jest.mock("../utils", () => ({
  initFirebase: jest.fn(),
  scrollToRefObject: jest.fn(),
  mbToBytes: jest.fn(),
  createUUID: jest.fn(),
}));

jest.mock("../access");

describe("Account Page", () => {
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
    updateUserProfile: jest.fn(),
    updatePassword: jest.fn(),
    sendEmailVerification: jest.fn(async () => {}),
  };
  const mockFn = jest.fn();

  const prices = {
    basic: { name: "BASIC", cost: 1200 },
    premium: { name: "PREMIUM", cost: 2400 },
    "premium-plus": { name: "PREMIUM-PLUS", cost: 4900 },
  };

  const roles = getRoles();

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    useUser.mockImplementation(() => userData);
  });

  describe.skip("when loaded and preloaded is true ", () => {
    describe("when role is set to free", () => {
      it("renders profile and plan section correctly", () => {
        const setWorking = jest.fn();
        const setLoaded = jest.fn();
        const setAlerts = jest.fn();
        const setDisplayName = jest.fn();
        const setRole = jest.fn();
        const setPrices = jest.fn();
        const setPricesLoaded = jest.fn();
        const setCurrentPassword = jest.fn();
        const setNewUserPassword = jest.fn();
        const setNewConfirmUserPassword = jest.fn();

        jest
          .spyOn(React, "useState")
          .mockImplementationOnce(() => {
            return [{}, setWorking];
          })

          .mockImplementationOnce(() => {
            return [true, setLoaded];
          })

          .mockImplementationOnce(() => {
            return [{}, setAlerts];
          })

          .mockImplementationOnce(() => {
            return ["John Doe", setDisplayName];
          })

          .mockImplementationOnce(() => {
            return ["free", setRole];
          })

          .mockImplementationOnce(() => {
            return [prices, setPrices];
          })

          .mockImplementationOnce(() => {
            return [true, setPricesLoaded];
          })

          .mockImplementationOnce(() => {
            return ["", setCurrentPassword];
          })

          .mockImplementationOnce(() => {
            return ["", setNewUserPassword];
          })

          .mockImplementationOnce(() => {
            return ["", setNewConfirmUserPassword];
          });

        const component = shallow(<AccountPage />);

        expect(component.find("img").length).toBe(1);
        expect(component.find("img").get(0).props).toStrictEqual({
          src: "/favicon.ico",
          alt: "logo",
        });
        expect(component.find("UserMenu").length).toBe(1);
        expect(component.find("h1").length).toBe(8);
        expect(component.find("h1").get(0).props).toStrictEqual({
          className: "margin-middle account-header",
          style: { fontSize: "36px" },
          children: "Profile",
        });
        expect(component.find("h1").get(1).props).toStrictEqual({
          className: "center margin-middle account-header",
          style: { fontSize: "36px" },
          children: "Account",
        });
        expect(component.find("h1").get(2).props).toStrictEqual({
          className: "center margin-middle account-header",
          style: { fontSize: "36px" },
          children: "Usage",
        });
        expect(component.find("h1").get(3).props).toStrictEqual({
          className: "center margin-middle account-header",
          style: { fontSize: "36px" },
          children: "Current Plan",
        });
        expect(component.find("h1").get(4).props).toStrictEqual({
          className: "price",
          children: "$0",
        });
        expect(component.find("h1").get(5).props).toStrictEqual({
          className: "price",
          children: ["$", 12],
        });
        expect(component.find("h1").get(6).props).toStrictEqual({
          className: "price",
          children: ["$", 24],
        });
        expect(component.find("h1").get(7).props).toStrictEqual({
          className: "price",
          children: ["$", 49],
        });
        expect(component.find("UserAvatar")).toBeTruthy();
        expect(component.find("UserAvatar").props().user).toStrictEqual(
          userData.user
        );

        expect(component.find(".current-plan").text()).toBe("Free Plan");
        expect(
          component
            .find("WithStyles(WithStyles(ForwardRef(TextField)))")
            .props()
        ).toStrictEqual({
          className: "material-input account-name",
          onChange: expect.any(Function),
          defaultValue: "John Doe",
          label: "Display Name",
        });

        component.find("WithStyles(WithStyles(ForwardRef(TextField)))").value =
          "MIKE";

        expect(component.find("h3").text()).toBe("johndoes@gmail.com");
        expect(component.find(".text-success").text()).toBe("Verified Email");

        expect(component.find("WithStyles(ForwardRef(Button))").length).toBe(6);
        expect(
          component.find("WithStyles(ForwardRef(Button))").get(0).props
        ).toStrictEqual({
          className: "confirm-button greyed",
          children: "Save Changes",
        });
        expect(
          component.find("WithStyles(ForwardRef(Button))").get(1).props
        ).toStrictEqual({
          className: "confirm-button",
          onClick: expect.any(Function),
          children: "Upgrade",
        });
        expect(
          component.find("WithStyles(ForwardRef(Button))").get(2).props
        ).toStrictEqual({
          className: "start-button greyed confirm-button",
          children: "Current Plan",
        });
        expect(
          component.find("WithStyles(ForwardRef(Button))").get(3).props
        ).toStrictEqual({
          className: "start-button confirm-button",
          onClick: expect.any(Function),
          children: "Upgrade",
        });
        expect(
          component.find("WithStyles(ForwardRef(Button))").get(4).props
        ).toStrictEqual({
          className: "start-button confirm-button",
          onClick: expect.any(Function),
          children: "Upgrade",
        });
        expect(
          component.find("WithStyles(ForwardRef(Button))").get(5).props
        ).toStrictEqual({
          className: "start-button confirm-button",
          onClick: expect.any(Function),
          children: "Upgrade",
        });

        expect(component.find("h2").length).toBe(24);
        expect(component.find("h2").get(0).props).toStrictEqual({
          children: "Boards",
        });
        expect(component.find("h2").get(1).props).toStrictEqual({
          children: "Storage",
        });
        // expect(component.find("h2").get(2).props).toStrictEqual({
        //   className: "plan-title",
        //   children: "Free Plan",
        // });
        expect(component.find("h2").get(3).props).toStrictEqual({
          children: [
            <CheckIcon />,
            " Create up to ",
            roles.free.maxBoards,
            " ",
            "Boards",
          ],
        });
        expect(component.find("h2").get(4).props).toStrictEqual({
          children: [<CheckIcon />, " Link to external content."],
        });
        expect(component.find("h2").get(5).props).toStrictEqual({
          children: [
            <CheckIcon />,
            " Share with clients, colleagues, and friends.",
          ],
        });
        expect(component.find("h2").get(6).props).toStrictEqual({
          children: [<CheckIcon />, " Upgrade anytime."],
        });
        expect(component.find("h2").get(7).props).toStrictEqual({
          className: "plan-title",
          children: "BASIC",
        });
        expect(component.find("h2").get(8).props).toStrictEqual({
          children: [<CheckIcon />, " Everything in the Free plan"],
        });
        expect(component.find("h2").get(9).props).toStrictEqual({
          children: [
            <CheckIcon />,
            " Create up to ",
            roles.basic.maxBoards,
            " ",
            "Boards",
          ],
        });
        expect(component.find("h2").get(10).props).toStrictEqual({
          children: [
            <CheckIcon />,
            " ",
            filesize(roles.basic.maxStorage),
            " ",
            "of file storage",
          ],
        });
        expect(component.find("h2").get(11).props).toStrictEqual({
          className: "plan-title",
          children: "PREMIUM",
        });
        expect(component.find("h2").get(12).props).toStrictEqual({
          children: [
            <CheckIcon />,
            " Everything in the",
            " ",
            "BASIC",
            " plan",
          ],
        });
        expect(component.find("h2").get(13).props).toStrictEqual({
          children: [
            <CheckIcon />,
            " Create up to",
            " ",
            roles.premium.maxBoards,
            " Boards",
          ],
        });
        expect(component.find("h2").get(14).props).toStrictEqual({
          children: [
            <CheckIcon />,
            " ",
            filesize(roles.premium.maxStorage),
            " ",
            "of file storage",
          ],
        });
        expect(component.find("h2").get(15).props).toStrictEqual({
          children: [<CheckIcon />, " Access Logs (Coming Soon)"],
        });
        expect(component.find("h2").get(16).props).toStrictEqual({
          children: [<CheckIcon />, " Board View/Edit Alerts"],
        });
        expect(component.find("h2").get(17).props).toStrictEqual({
          children: [<CheckIcon />, " Create Public Boards"],
        });
        expect(component.find("h2").get(18).props).toStrictEqual({
          className: "plan-title",
          children: "PREMIUM-PLUS",
        });
        expect(component.find("h2").get(19).props).toStrictEqual({
          children: [
            <CheckIcon />,
            " Everything in the",
            " ",
            "PREMIUM",
            " plan",
          ],
        });
        expect(component.find("h2").get(20).props).toStrictEqual({
          children: [
            <CheckIcon />,
            " Create up to",
            " ",
            roles["premium-plus"].maxBoards,
            " Boards",
          ],
        });
        expect(component.find("h2").get(21).props).toStrictEqual({
          children: [
            <CheckIcon />,
            " ",
            filesize(roles["premium-plus"].maxStorage),
            " of file storage",
          ],
        });
        expect(component.find("h2").get(22).props).toStrictEqual({
          children: [<CheckIcon />, " Enhanced Technical Support", " "],
        });
        expect(component.find("h2").get(23).props).toStrictEqual({
          children: [<CheckIcon />, " Your Logo/Branding (Coming Soon)"],
        });

        const userBoardUsage = component.find("UserBoardUsage");
        for (let i = 0; i < userBoardUsage.length; ) {
          expect(component.find("UserBoardUsage").get(i).props).toStrictEqual({
            variant: "small",
          });

          i += 1;
        }

        for (let i = 2; i < component.find(".details span").length; ) {
          expect(component.find(".details span").get(i).props).toStrictEqual({
            children: "Includes:",
          });
          expect(
            component.find(".price-container span").get(i).props
          ).toStrictEqual({
            children: "per month",
          });

          i += 1;
        }
      });
    });

    describe("when role is set to basic", () => {
      it("renders profile and plan section correctly", () => {
        const setWorking = jest.fn();
        const setLoaded = jest.fn();
        const setAlerts = jest.fn();
        const setDisplayName = jest.fn();
        const setRole = jest.fn();
        const setPrices = jest.fn();
        const setPricesLoaded = jest.fn();
        const setPortalUrl = jest.fn();
        const setCurrentPassword = jest.fn();
        const setNewUserPassword = jest.fn();
        const setNewConfirmUserPassword = jest.fn();

        jest
          .spyOn(React, "useState")
          .mockImplementationOnce(() => [{}, setWorking])
          .mockImplementationOnce(() => [true, setLoaded])
          .mockImplementationOnce(() => [{}, setAlerts])
          .mockImplementationOnce(() => ["John Doe", setDisplayName])
          .mockImplementationOnce(() => ["basic", setRole])
          .mockImplementationOnce(() => [prices, setPrices])
          .mockImplementationOnce(() => [true, setPricesLoaded])
          .mockImplementationOnce(() => [window.location.href, setPortalUrl])
          .mockImplementationOnce(() => ["", setCurrentPassword])
          .mockImplementationOnce(() => ["", setNewUserPassword])
          .mockImplementationOnce(() => ["", setNewConfirmUserPassword]);
        const component = shallow(<AccountPage />);
        expect(component.find(".current-plan").text()).toBe("BASIC");
      });
    });

    describe("when role is set to premium", () => {
      it("renders profile and plan section correctly", () => {
        const setWorking = jest.fn();
        const setLoaded = jest.fn();
        const setAlerts = jest.fn();
        const setDisplayName = jest.fn();
        const setRole = jest.fn();
        const setPrices = jest.fn();
        const setPricesLoaded = jest.fn();
        const setPortalUrl = jest.fn();
        const setCurrentPassword = jest.fn();
        const setNewUserPassword = jest.fn();
        const setNewConfirmUserPassword = jest.fn();

        jest
          .spyOn(React, "useState")
          .mockImplementationOnce(() => [{}, setWorking])
          .mockImplementationOnce(() => [true, setLoaded])
          .mockImplementationOnce(() => [{}, setAlerts])
          .mockImplementationOnce(() => ["John Doe", setDisplayName])
          .mockImplementationOnce(() => ["premium", setRole])
          .mockImplementationOnce(() => [prices, setPrices])
          .mockImplementationOnce(() => [true, setPricesLoaded])
          .mockImplementationOnce(() => [window.location.href, setPortalUrl])
          .mockImplementationOnce(() => ["", setCurrentPassword])
          .mockImplementationOnce(() => ["", setNewUserPassword])
          .mockImplementationOnce(() => ["", setNewConfirmUserPassword]);
        const component = shallow(<AccountPage />);
        expect(component.find(".current-plan").text()).toBe("PREMIUM");
      });
    });

    describe("when role is set to premium-plus", () => {
      it("renders profile and plan section correctly", () => {
        const setWorking = jest.fn();
        const setLoaded = jest.fn();
        const setAlerts = jest.fn();
        const setDisplayName = jest.fn();
        const setRole = jest.fn();
        const setPrices = jest.fn();
        const setPricesLoaded = jest.fn();
        const setPortalUrl = jest.fn();
        const setCurrentPassword = jest.fn();
        const setNewUserPassword = jest.fn();
        const setNewConfirmUserPassword = jest.fn();

        jest
          .spyOn(React, "useState")
          .mockImplementationOnce(() => [{}, setWorking])
          .mockImplementationOnce(() => [true, setLoaded])
          .mockImplementationOnce(() => [{}, setAlerts])
          .mockImplementationOnce(() => ["John Doe", setDisplayName])
          .mockImplementationOnce(() => ["premium-plus", setRole])
          .mockImplementationOnce(() => [prices, setPrices])
          .mockImplementationOnce(() => [true, setPricesLoaded])
          .mockImplementationOnce(() => [window.location.href, setPortalUrl])
          .mockImplementationOnce(() => ["", setCurrentPassword])
          .mockImplementationOnce(() => ["", setNewUserPassword])
          .mockImplementationOnce(() => ["", setNewConfirmUserPassword]);
        const component = shallow(<AccountPage />);
        expect(component.find(".current-plan").text()).toBe("PREMIUM-PLUS");
      });
    });

    describe("when email Verified is false", () => {
      afterEach(() => {
        jest.clearAllMocks();
      });

      it("renders re-send email verification correctly", () => {
        const setWorking = jest.fn();
        const setLoaded = jest.fn();
        const setAlerts = jest.fn();
        const setDisplayName = jest.fn();
        const setRole = jest.fn();
        const setPrices = jest.fn();
        const setPricesLoaded = jest.fn();
        const setPortalUrl = jest.fn();
        const setCurrentPassword = jest.fn();
        const setNewUserPassword = jest.fn();
        const setNewConfirmUserPassword = jest.fn();

        jest
          .spyOn(React, "useState")
          .mockImplementationOnce(() => [{}, setWorking])
          .mockImplementationOnce(() => [true, setLoaded])
          .mockImplementationOnce(() => [{}, setAlerts])
          .mockImplementationOnce(() => ["Romeo", setDisplayName])
          .mockImplementationOnce(() => ["premium-plus", setRole])
          .mockImplementationOnce(() => [prices, setPrices])
          .mockImplementationOnce(() => [true, setPricesLoaded])
          .mockImplementationOnce(() => [window.location.href, setPortalUrl])
          .mockImplementationOnce(() => ["", setCurrentPassword])
          .mockImplementationOnce(() => ["", setNewUserPassword])
          .mockImplementationOnce(() => ["", setNewConfirmUserPassword]);

        userData.user.emailVerified = false;

        useUser.mockImplementation(() => userData);
        const component = shallow(<AccountPage />);

        expect(component.find(".text-danger").text()).toBe(
          "Email not verified   "
        );
        expect(
          component.find("WithStyles(ForwardRef(Button))").get(0).props
        ).toStrictEqual({
          className: "confirm-button",
          disabled: undefined,
          onClick: expect.any(Function),
          children: "Re-send verification email",
        });

        expect(
          component.find("WithStyles(ForwardRef(Button))").get(1).props
        ).toStrictEqual({
          className: "confirm-button",
          onClick: expect.any(Function),
          children: "Save Changes",
        });

        component.find("WithStyles(ForwardRef(Button))").get(0).props.onClick();
        component.find("WithStyles(ForwardRef(Button))").get(1).props.onClick();
      });

      it("renders sendEmailVerification error", () => {
        const setWorking = jest.fn();
        const setLoaded = jest.fn();
        const setAlerts = jest.fn();
        const setDisplayName = jest.fn();
        const setRole = jest.fn();
        const setPrices = jest.fn();
        const setPricesLoaded = jest.fn();
        const setPortalUrl = jest.fn();
        const setCurrentPassword = jest.fn();
        const setNewUserPassword = jest.fn();
        const setNewConfirmUserPassword = jest.fn();

        jest
          .spyOn(React, "useState")
          .mockImplementationOnce(() => [{}, setWorking])
          .mockImplementationOnce(() => [true, setLoaded])
          .mockImplementationOnce(() => [{}, setAlerts])
          .mockImplementationOnce(() => ["Romeo", setDisplayName])
          .mockImplementationOnce(() => ["premium-plus", setRole])
          .mockImplementationOnce(() => [prices, setPrices])
          .mockImplementationOnce(() => [true, setPricesLoaded])
          .mockImplementationOnce(() => [window.location.href, setPortalUrl])
          .mockImplementationOnce(() => ["", setCurrentPassword])
          .mockImplementationOnce(() => ["", setNewUserPassword])
          .mockImplementationOnce(() => ["", setNewConfirmUserPassword]);

        userData.user.emailVerified = false;
        userData.sendEmailVerification = jest.fn(async () => {
          throw Error("error");
        });

        useUser.mockImplementation(() => userData);
        const component = shallow(<AccountPage />);

        expect(component.find(".text-danger").text()).toBe(
          "Email not verified   "
        );
        expect(
          component.find("WithStyles(ForwardRef(Button))").get(0).props
        ).toStrictEqual({
          className: "confirm-button",
          disabled: undefined,
          onClick: expect.any(Function),
          children: "Re-send verification email",
        });

        expect(
          component.find("WithStyles(ForwardRef(Button))").get(1).props
        ).toStrictEqual({
          className: "confirm-button",
          onClick: expect.any(Function),
          children: "Save Changes",
        });

        component.find("WithStyles(ForwardRef(Button))").get(0).props.onClick();
        component.find("WithStyles(ForwardRef(Button))").get(1).props.onClick();
      });
    });

    describe("useUserSubscription", () => {
      const role = "free";
      const data = jest.fn(() => ({ role }));
      const user = {};
      const setRole = jest.fn();
      const setLoaded = jest.fn();
      const setCurrentPassword = jest.fn();
      const setNewUserPassword = jest.fn();
      const setNewConfirmUserPassword = jest.fn();

      jest
        .spyOn(React, "useState")
        .mockImplementationOnce(() => ["", setCurrentPassword])
        .mockImplementationOnce(() => ["", setNewUserPassword])
        .mockImplementationOnce(() => ["", setNewConfirmUserPassword]);

      afterEach(() => {
        jest.clearAllMocks();
      });

      it("set role and loaded when data is not empty", async () => {
        const doc = { data };
        getUserSubscription.mockImplementation(async () => doc);

        await act(async () => {
          renderHook(() => {
            useUserSubscription(user, setRole, setLoaded);
          });
        });

        expect(getUserSubscription).toHaveBeenCalledTimes(1);
        expect(getUserSubscription).toHaveBeenCalledWith(user);
        expect(setRole).toHaveBeenCalledTimes(1);
        expect(setRole).toHaveBeenCalledWith(role);
        expect(setLoaded).toHaveBeenCalledTimes(1);
        expect(setLoaded).toHaveBeenCalledWith(true);
      });

      it("set loaded only when data is empty", async () => {
        const doc = undefined;
        getUserSubscription.mockImplementation(async () => doc);

        await act(async () => {
          renderHook(() => {
            useUserSubscription(user, setRole, setLoaded);
          });
        });

        expect(getUserSubscription).toHaveBeenCalledTimes(1);
        expect(getUserSubscription).toHaveBeenCalledWith(user);
        expect(setRole).toHaveBeenCalledTimes(0);
        expect(setLoaded).toHaveBeenCalledTimes(1);
        expect(setLoaded).toHaveBeenCalledWith(true);
      });
    });

    describe("usePrices", () => {
      afterEach(() => {
        jest.clearAllMocks();
      });

      it("set prices", async () => {
        const setWorking = jest.fn();
        const setLoaded = jest.fn();
        const setAlerts = jest.fn();
        const setDisplayName = jest.fn();
        const setRole = jest.fn();
        const setPrices = jest.fn();
        const setPricesLoaded = jest.fn();
        const setPortalUrl = jest.fn();

        jest
          .spyOn(React, "useState")
          .mockImplementationOnce(() => [{}, setWorking])
          .mockImplementationOnce(() => [true, setLoaded])
          .mockImplementationOnce(() => [{}, setAlerts])
          .mockImplementationOnce(() => ["John Doe", setDisplayName])
          .mockImplementationOnce(() => ["premium-plus", setRole])
          .mockImplementationOnce(() => [prices, setPrices])
          .mockImplementationOnce(() => [true, setPricesLoaded])
          .mockImplementationOnce(() => [window.location.href, setPortalUrl]);

        const plans = [
          { id: "1", role: "basic", name: "BASIC" },
          { id: "2", role: "premium", name: "PREMIUM" },
          { id: "3", role: "premium-plus", name: "PREMIUM-PLUS" },
        ];

        getSubscriptionPlans.mockImplementation(async () => plans);

        getPrices.mockImplementation(async () => "doc");

        await act(async () => {
          renderHook(() => {
            usePrices(setPrices, setPricesLoaded);
          });
        });

        expect(setPrices).toHaveBeenCalledTimes(1);
        expect(setPrices).toHaveBeenCalledWith({
          basic: {
            0: "d",
            1: "o",
            2: "c",
            name: "BASIC",
          },
          premium: {
            0: "d",
            1: "o",
            2: "c",
            name: "PREMIUM",
          },
          "premium-plus": {
            0: "d",
            1: "o",
            2: "c",
            name: "PREMIUM-PLUS",
          },
        });
      });

      it("set customer portal url", async () => {
        const setPortalUrl = mockFn;
        const setPortalLoaded = mockFn;
        getCustomerPortalUrl.mockImplementation(async () => "www.johndoe.com");

        // await act(async () => {
        //   renderHook(() => {
        //     useCustomerPortalUrl(setPortalUrl, setPortalLoaded);
        //   });
        // });

        expect(setPortalUrl).toHaveBeenCalledTimes(2);
        expect(setPortalUrl).toHaveBeenCalledWith("www.johndoe.com");
        expect(setPortalLoaded).toHaveBeenCalledTimes(2);
        expect(setPortalLoaded).toHaveBeenCalledWith(true);
      });
    });
  });
});
