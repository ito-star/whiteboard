import _find from "lodash/find";
import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { createPath } from "history";
import { useHistory } from "react-router-dom";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import ButtonLink from "../ButtonLink";
import { getPrices, getSubscriptionPlans, startSubscription } from "../stripe";
import useUser from "../auth/useUser";
import { makeUrl } from "../utils";

export const usePrices = (setPrices) => {
  // this is only executed once
  useEffect(() => {
    // update new price ids if necessary
    getSubscriptionPlans()
      .then((plans) => {
        let basicPrice;
        let premiumPrice;
        let premiumPlusPrice;

        plans.forEach((plan) => {
          if (plan.role === "basic") {
            basicPrice = getPrices(plan.id);
          }
          if (plan.role === "premium") {
            premiumPrice = getPrices(plan.id);
          }
          if (plan.role === "premium-plus") {
            premiumPlusPrice = getPrices(plan.id);
          }
        });
        return Promise.all([basicPrice, premiumPrice, premiumPlusPrice, plans]);
      })
      .then((arr) => {
        const [basic, premium, premiumPlus, plans] = arr;

        let basicProduct;
        let premiumProduct;
        let premiumPlusProduct;

        plans.forEach((plan) => {
          if (plan.role === "basic") {
            basicProduct = { ...basic, name: plan.name };
          }
          if (plan.role === "premium") {
            premiumProduct = { ...premium, name: plan.name };
          }
          if (plan.role === "premium-plus") {
            premiumPlusProduct = { ...premiumPlus, name: plan.name };
          }
        });

        setPrices({
          basic: basicProduct,
          premium: premiumProduct,
          "premium-plus": premiumPlusProduct,
        });
      });
  }, [setPrices]);
};

function StripeUpgradeButton(props) {
  const {
    interval,
    destination,
    userPlan,
    upgradeablePlan,
    plan: planProp,
  } = props;
  const { user } = useUser();
  const [prices, setPrices] = React.useState();
  const history = useHistory();

  usePrices(setPrices);

  const redirectToPurchase = (type) => {
    const subscriptionPlan = _find(prices[type], (plan) => {
      return plan.interval === interval;
    });

    // eslint-disable-next-line camelcase
    let success_url;
    // eslint-disable-next-line camelcase
    let cancel_url;

    if (destination) {
      const destinationUrl = makeUrl(history, destination).toString();
      // eslint-disable-next-line camelcase
      success_url = destinationUrl;
      // eslint-disable-next-line camelcase
      cancel_url = destinationUrl;
    }

    startSubscription(user, {
      price: subscriptionPlan.id,
      // eslint-disable-next-line camelcase
      ...(success_url && {
        // eslint-disable-next-line camelcase
        success_url,
      }),
      // eslint-disable-next-line camelcase
      ...(cancel_url && {
        // eslint-disable-next-line camelcase
        cancel_url,
      }),
    });
  };

  const redirectToCustomerPortalURL = () => {
    const billingPortalPath = {
      pathname: "/account/billing/billing-portal",
    };
    const searchParams = new URLSearchParams();

    if (destination) {
      const destPath = createPath(destination);
      searchParams.set("destination", destPath);
    }

    billingPortalPath.search = `?${searchParams}`;

    history.push(billingPortalPath);
  };

  const handleUpgradeClick = () => {
    if (userPlan === "free") {
      redirectToPurchase(upgradeablePlan);
    } else {
      redirectToCustomerPortalURL(userPlan);
    }
  };

  const renderGetStarted = () => {
    let content;

    if (userPlan !== "none") {
      if (!prices) {
        content = (
          <div className="start-button-container">
            <CircularProgress />
          </div>
        );
      } else if (userPlan === "free" && planProp === "free") {
        content = (
          <div className="start-button-container">
            <Button className="start-button greyed confirm-button">
              Current Plan
            </Button>
          </div>
        );
      } else if (userPlan === upgradeablePlan && prices) {
        content = (
          <div className="start-button-container">
            <Button
              onClick={redirectToCustomerPortalURL}
              className="start-button confirm-button"
            >
              Manage Account
            </Button>
          </div>
        );
      } else if (upgradeablePlan && prices) {
        content = (
          <div className="start-button-container">
            <Button
              className="start-button confirm-button"
              onClick={handleUpgradeClick}
            >
              Upgrade
            </Button>
          </div>
        );
      }
    } else {
      content = (
        <div className="start-button-container">
          <ButtonLink className="start-button" route="/signup">
            Get Started
          </ButtonLink>
        </div>
      );
    }

    return content;
  };

  return renderGetStarted();
}

StripeUpgradeButton.defaultProps = {
  userPlan: "",
};

StripeUpgradeButton.propTypes = {
  userPlan: PropTypes.string,
};

export default StripeUpgradeButton;
