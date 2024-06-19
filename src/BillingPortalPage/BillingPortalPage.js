import React, { useState, useEffect } from "react";
import { compose } from "redux";
import Alert from "@material-ui/lab/Alert";
import { useLocation, useHistory } from "react-router-dom";
import { getCustomerRecord, getCustomerPortalUrl } from "../stripe";
import { useDestination, makeUrl } from "../utils";
import restrictedPage from "../auth/restrictedPage";
import useUser from "../auth/useUser";
import PricingSummary from "../PricingSummary";
import SimpleNavBar from "../SimpleNavBar";
import Loader from "../components/Loader";

import "./BillingPortalPage.scss";

const BillingPortalPage = () => {
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState();
  const location = useLocation();
  const history = useHistory();
  const { user } = useUser();
  let destination = useDestination();

  if (destination.pathname === location.pathname) {
    destination = {
      pathname: "/account/billing",
    };
  }

  useEffect(() => {
    const redirectToBillingPortal = async () => {
      try {
        const destinationUrl = makeUrl(history, destination).toString();
        const customerRecord = await getCustomerRecord(user);

        if (customerRecord) {
          const billingPortalUrl = await getCustomerPortalUrl({
            returnUrl: destinationUrl,
          });

          window.location.href = billingPortalUrl;
        } else {
          setLoading(false);
        }
      } catch (e) {
        setError(e.message);
        setLoading(false);
      }
    };
    redirectToBillingPortal();
  }, [destination, user, history]);

  let content = null;

  if (isLoading) {
    content = (
      <div className="loading-billing-portal-screen">
        <h1>Transferring you to your billing portal...</h1>
        <Loader id="loader" type="cylon" hasOverlay={false} />
      </div>
    );
  } else if (error) {
    content = <Alert severity="error">{error}</Alert>;
  } else {
    content = (
      <>
        <h1>
          It looks like you don&apos;t have a subscription plan. Please choose
          one below:
        </h1>
        <PricingSummary userPlan="free" destination={destination} />
      </>
    );
  }

  return (
    <>
      <SimpleNavBar />
      <div className="container-fluid">
        <div style={{ textAlign: "left" }}>
          <br />
          <br />
          <br />
          <div className="center margin-middle">{content}</div>
        </div>
      </div>
    </>
  );
};

const enchance = compose(restrictedPage());

export default enchance(BillingPortalPage);
