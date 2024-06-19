import React from "react";
import PricingSummary from "../PricingSummary";

const BillingSection = ({ role }) => {
  return (
    <div className="billing-section">
      <h1 className="center account-header" style={{ fontSize: "36px" }}>
        Current Plan
      </h1>
      <PricingSummary id="billing" userPlan={role} />
    </div>
  );
};

export default BillingSection;
