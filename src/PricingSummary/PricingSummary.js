import React, { useEffect } from "react";
import "./PricingSummary.scss";
import CheckIcon from "@material-ui/icons/CheckOutlined";
import CornerRibbon from "react-corner-ribbon";
import filesize from "filesize";
import {
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
} from "@material-ui/core";
import { withStyles } from "@material-ui/core/styles";
import PropTypes from "prop-types";
import { getRoles } from "../access";
import {
  getPrices,
  getSubscriptionPlans,
  getUserSubscription,
} from "../stripe";
import StripeUpgradeButton from "../StripeUpgradeButton/StripeUpgradeButton";
import Loader from "../components/Loader";

const AntSwitch = withStyles((theme) => ({
  root: {
    width: 28,
    height: 16,
    padding: 0,
    display: "flex",
  },
  switchBase: {
    padding: 2,
    color: theme.palette.grey[500],
    "&$checked": {
      transform: "translateX(12px)",
      color: "#2c387e",
      "& + $track": {
        opacity: 1,
        backgroundColor: "#7784d0",
        borderColor: theme.palette.primary.main,
      },
    },
  },
  thumb: {
    width: 12,
    height: 12,
    boxShadow: "none",
  },
  track: {
    border: `1px solid ${theme.palette.grey[500]}`,
    borderRadius: 16 / 2,
    opacity: 1,
    backgroundColor: theme.palette.common.white,
  },
  checked: {},
}))(Switch);

export const useUserSubscription = (user, setRole, setLoaded) => {
  useEffect(() => {
    const loadSubscription = async () => {
      const doc = await getUserSubscription(user);
      if (doc) {
        setRole(doc.data().role);
      }
      setLoaded(true);
    };
    loadSubscription();
  }, [user, setRole, setLoaded]);
};

function PricingSummary(props) {
  const [prices, setPrices] = React.useState({});
  const [pricesLoaded, setPricesLoaded] = React.useState(false);
  const [interval, setInterval] = React.useState("month");
  const { userPlan, id, destination } = props;

  useEffect(() => {
    // update new price ids if necessary
    getSubscriptionPlans()
      .then((plans) => {
        let basicPrice;
        let premiumPrice;
        let premiumPlusPrice;

        plans.forEach((plan) => {
          if (plan.role === "basic") {
            basicPrice = getPrices(plan.id, plan.name);
          }
          if (plan.role === "premium") {
            premiumPrice = getPrices(plan.id, plan.name);
          }
          if (plan.role === "premium-plus") {
            premiumPlusPrice = getPrices(plan.id, plan.name);
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
            basicProduct = [...basic];
          }
          if (plan.role === "premium") {
            premiumProduct = [...premium];
          }
          if (plan.role === "premium-plus") {
            premiumPlusProduct = [...premiumPlus];
          }
        });

        setPrices({
          basic: basicProduct,
          premium: premiumProduct,
          "premium-plus": premiumPlusProduct,
        });
        setPricesLoaded(true);
      });
  }, [setPrices, setPricesLoaded]);

  const roles = getRoles();

  const handleSubscriptionPlanChange = () => {
    const intervalState = interval === "month" ? "year" : "month";
    setInterval(intervalState);
  };

  const renderFeaturesList = (features = []) => {
    return (
      <List disablePadding>
        {features.map((feature) => {
          return (
            <ListItem key={feature}>
              <ListItemIcon>
                <CheckIcon />
              </ListItemIcon>
              <ListItemText primary={feature} />
            </ListItem>
          );
        })}
      </List>
    );
  };

  const renderFreeBlock = () => {
    let content = null;

    if (userPlan === "free" || userPlan === "none") {
      content = (
        <div className="plan basic-plan">
          <div className="price-body">
            <br />
            <h2 className="plan-title">Free</h2>
            <br />
            <h1 className="price">$0</h1>
            <span>per {interval}</span>
          </div>

          <div className="details">
            <span className="includes">Includes:</span>
            {renderFeaturesList([
              `Create and customize up to ${roles.free.maxBoards} Boards.`,
              "Embed external content.",
              `${filesize(roles.free.maxStorage)} of file storage.`,
              "Share your boards with anyone.",
              "Upgrade anytime.",
            ])}
          </div>
          <StripeUpgradeButton
            userPlan={userPlan}
            upgradeablePlan="basic"
            plan="free"
            destination={destination}
          />
        </div>
      );
    }

    return content;
  };

  const renderBasicBlock = () => {
    let content = null;

    if (userPlan === "none" || userPlan === "basic" || userPlan === "free") {
      content = prices.basic.map((basicProduct) => {
        if (interval === basicProduct.interval) {
          return (
            <div className="plan w-20-plan" key={basicProduct.id}>
              <div className="price-body">
                <br />
                <h2 className="plan-title">{basicProduct.planName}</h2>
                <br />
                <h1 className="price w-20-plan">${basicProduct.cost / 100}</h1>

                <span>per {basicProduct.interval}</span>
              </div>

              <div className="details">
                <span className="includes">Includes:</span>
                {renderFeaturesList([
                  "Everything in the Free plan.",
                  `Create up to ${roles.basic.maxBoards} Boards.`,
                  `${filesize(roles.basic.maxStorage)} of file storage.`,
                  "Password-protected boards.",
                  "Request files from others in shared boards.",
                  <a
                    href="https://chrome.google.com/webstore/detail/whatboard/npaccllkphikfkdbmedailkemffjffgg"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Chrome extension
                  </a>,
                  <>
                    <a
                      href="https://zapier.com"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Zapier
                    </a>{" "}
                    integration (coming soon).
                  </>,
                ])}
              </div>
              <StripeUpgradeButton
                userPlan={userPlan}
                hasPortalUrl
                interval={interval}
                upgradeablePlan="basic"
                destination={destination}
              />
            </div>
          );
        }
        return null;
      });
    }

    return content;
  };

  const renderPremiumBlock = () => {
    let content = null;

    if (
      userPlan === "none" ||
      userPlan === "premium" ||
      userPlan === "basic" ||
      userPlan === "free"
    ) {
      content = prices.premium.map((premiumProduct) => {
        if (interval === premiumProduct.interval) {
          return (
            <div className="plan w-50-plan" key={premiumProduct.id}>
              <CornerRibbon
                fontColor="#f0f0f0"
                backgroundColor="#e43"
                style={{ fontSize: "16px", lineHeight: "40px" }}
              >
                Most Popular
              </CornerRibbon>
              <div className="price-body">
                <br />
                <h2 className="plan-title">{premiumProduct.planName}</h2>
                <br />
                <h1 className="price w-50-plan">
                  ${premiumProduct.cost / 100}
                </h1>
                <span>per {premiumProduct.interval}</span>
              </div>

              <div className="details">
                <span className="includes">Includes:</span>
                {renderFeaturesList([
                  `Everything in the ${prices.basic[0].planName} plan.`,
                  "Create public boards (landing pages).",
                  `Create up to ${roles.premium.maxBoards} Boards.`,
                  `${filesize(roles.premium.maxStorage)} of file storage.`,
                  "Alerts & notifications (coming soon).",
                  "Access logs (coming soon).",
                ])}
              </div>
              <StripeUpgradeButton
                userPlan={userPlan}
                hasPortalUrl
                interval={interval}
                upgradeablePlan="premium"
                destination={destination}
              />
            </div>
          );
        }

        return null;
      });
    }

    return content;
  };

  const renderPremiumPlusBlock = () => {
    let content = null;

    if (
      userPlan === "none" ||
      userPlan === "premium-plus" ||
      userPlan === "premium" ||
      userPlan === "basic" ||
      userPlan === "free"
    ) {
      content = prices["premium-plus"].map((premiumPlusProduct) => {
        if (interval === premiumPlusProduct.interval) {
          return (
            <div className="plan w-100-plan" key={premiumPlusProduct.id}>
              <div className="price-body">
                <br />
                <h2 className="plan-title">{premiumPlusProduct.planName}</h2>
                <br />
                <h1 className="price w-50-plan">
                  ${premiumPlusProduct.cost / 100}
                </h1>
                <span>per {premiumPlusProduct.interval}</span>
              </div>

              <div className="details">
                <span className="includes">Includes:</span>
                {renderFeaturesList([
                  `Everything in the ${prices.premium[0].planName} plan.`,
                  `Create up to ${roles["premium-plus"].maxBoards} Boards.`,
                  `${filesize(
                    roles["premium-plus"].maxStorage
                  )} of file storage.`,
                  "Enhanced Technical Support.",
                  "Your Logo/Branding.",
                ])}
              </div>
              <StripeUpgradeButton
                userPlan={userPlan}
                hasPortalUrl
                interval={interval}
                upgradeablePlan="premium-plus"
                destination={destination}
              />
            </div>
          );
        }

        return null;
      });
    }

    return content;
  };

  const gridItemProps = {
    item: true,
    lg: 3,
    md: 4,
    sm: 6,
    xs: 12,
  };

  return (
    <>
      <div id={id} className="pricing-summary">
        {!pricesLoaded && <Loader />}
        {pricesLoaded && (
          <>
            <div>
              <Grid
                component="label"
                container
                alignItems="center"
                spacing={1}
                className="pricing-summary--switch"
              >
                <Grid item>Pay Monthly</Grid>
                <Grid item>
                  <AntSwitch
                    checked={interval === "year"}
                    onChange={handleSubscriptionPlanChange}
                  />
                </Grid>
                <Grid item>
                  Pay Yearly{" "}
                  <span className="pricing-summary--annual-label">
                    (Save 5% with annual billing)
                  </span>
                </Grid>
              </Grid>
            </div>
            <Grid
              container
              className="plan-view"
              spacing={2}
              alignItems="stretch"
            >
              <Grid {...gridItemProps}>{renderFreeBlock(prices)}</Grid>
              <Grid {...gridItemProps}>{renderBasicBlock()}</Grid>
              <Grid {...gridItemProps}>{renderPremiumBlock()}</Grid>
              <Grid {...gridItemProps}>{renderPremiumPlusBlock()}</Grid>
            </Grid>
          </>
        )}
      </div>
    </>
  );
}

PricingSummary.defaultProps = {
  userPlan: "",
  id: null,
  destination: null,
};

PricingSummary.propTypes = {
  userPlan: PropTypes.string,
  id: PropTypes.string,
  destination: PropTypes.shape({
    pathname: PropTypes.string,
    search: PropTypes.string,
    hash: PropTypes.string,
  }),
};

export default PricingSummary;
