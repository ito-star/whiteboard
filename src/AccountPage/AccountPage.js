import React, { lazy } from "react";
import {
  Switch,
  Route as ReactRouterRoute,
  useRouteMatch,
} from "react-router-dom";
import * as Sentry from "@sentry/react";
import { connect } from "react-redux";
import { compose } from "redux";
import "firebase/compat/auth";
import restrictedPage from "../auth/restrictedPage";
import "./AccountPage.scss";
import { initFirebase } from "../utils";
import useUser from "../auth/useUser";
import Loader from "../components/Loader";
import useUserSubscription from "./useUserSubscription";
import usePrices from "./usePrices";

const ErrorPage = lazy(() => import("../ErrorPage"));
const Layout = lazy(() => import("./Layout"));
const GeneralInfo = lazy(() => import("./GeneralInfo"));
const SecuritySection = lazy(() => import("./SecuritySection"));
const BillingSection = lazy(() => import("./BillingSection"));
const BrandingSection = lazy(() => import("./BrandingSection"));

const Route = Sentry.withSentryRouting(ReactRouterRoute);

initFirebase();

export const AccountPage = () => {
  const { user } = useUser();
  const { path } = useRouteMatch();
  const [loaded, setLoaded] = React.useState(false);
  const [role, setRole] = React.useState("free");
  const [prices, setPrices] = React.useState({});
  const [pricesLoaded, setPricesLoaded] = React.useState(false);

  useUserSubscription(user, setRole, setLoaded);
  usePrices(setPrices, setPricesLoaded);

  return (
    <>
      {(!loaded || !pricesLoaded) && <Loader isFullScreen />}
      {loaded && pricesLoaded && (
        <Switch>
          <Route path={path} exact>
            <Layout>
              <GeneralInfo
                role={role}
                prices={prices}
                pricesLoaded={pricesLoaded}
              />
            </Layout>
          </Route>
          <Route path={`${path}/branding`} exact>
            <Layout>
              <BrandingSection />
            </Layout>
          </Route>
          <Route exact path={`${path}/security`}>
            <Layout>
              <SecuritySection />
            </Layout>
          </Route>
          <Route exact path={`${path}/billing`}>
            <Layout>
              <BillingSection role={role} />
            </Layout>
          </Route>
          <Route>
            <ErrorPage />
          </Route>
        </Switch>
      )}
    </>
  );
};

const enhance = compose(connect(), restrictedPage());

export default enhance(AccountPage);
