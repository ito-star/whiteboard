import { useEffect } from "react";
import { getPrices, getSubscriptionPlans } from "../stripe";

const usePrices = (setPrices, setPricesLoaded) => {
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
        setPricesLoaded(true);
      });
  }, [setPrices, setPricesLoaded]);
};

export default usePrices;
