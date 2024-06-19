import React, { useEffect } from "react";
import PropTypes from "prop-types";
import firebase from "firebase/compat/app";
import "firebase/compat/database";
import Alert from "react-bootstrap/Alert";
import SwipeableViews from "react-swipeable-views";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import AppBar from "@material-ui/core/AppBar";
import TabContext from "@material-ui/lab/TabContext";
import TabPanel from "@material-ui/lab/TabPanel";
import TabList from "@material-ui/lab/TabList";
import Tab from "@material-ui/core/Tab";
import _forEach from "lodash/forEach";

import { initFirebase } from "../utils";
import useUser from "../auth/useUser";
import SimpleNavBar from "../SimpleNavBar";
// import useSubmit from "./useSubmit";
// eslint-disable-next-line import/no-webpack-loader-syntax
import AcceptableUsePolicy, {
  frontMatter as aupFrontMatter,
  // eslint-disable-next-line import/no-unresolved
} from "!babel-loader!mdx-loader!../tos/acceptable-use-policy.mdx";
// eslint-disable-next-line import/no-webpack-loader-syntax
import PrivacyPolicy, {
  frontMatter as privacyFrontMatter,
  // eslint-disable-next-line import/no-unresolved
} from "!babel-loader!mdx-loader!../tos/privacy-policy.mdx";
// eslint-disable-next-line import/no-webpack-loader-syntax
import Terms, {
  frontMatter as termsFrontMatter,
  // eslint-disable-next-line import/no-unresolved
} from "!babel-loader!mdx-loader!../tos/terms-of-service.mdx";

import "../tos/tos-page.scss";

initFirebase();

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.paper,
  },
  tabPanel: {
    maxHeight: 300,
    [theme.breakpoints.up("sm")]: {
      maxHeight: 500,
    },
    overflow: "auto",
    padding: "1rem",
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: "0.75rem",
  },
}));

export const useLoadingUserTos = (
  loadingUser,
  user,
  setUserTos,
  setError,
  setLoading
) => {
  useEffect(() => {
    const loadUserTos = async () => {
      if (!loadingUser) {
        try {
          const snap = await firebase
            .database()
            .ref(`/users/${user.wbid}/tos`)
            .once("value");

          if (snap.exists()) {
            setUserTos(snap.val());
          } else {
            setUserTos({});
          }
        } catch (e) {
          setError(e.message);
        } finally {
          setLoading(false);
        }
      }
    };
    loadUserTos();
  }, [loadingUser, user.wbid, setUserTos, setError, setLoading]);
};

export const TosCheck = (props) => {
  const { loading = null, children = null } = props;

  const { user, loadingUser } = useUser();
  const [isLoading, setLoading] = React.useState(true);
  const [error, setError] = React.useState();
  const [userTos, setUserTos] = React.useState({});
  const muiTheme = useTheme();
  const classes = useStyles();
  const [tabValue, setTabValue] = React.useState(0);

  const [alerts, setAlerts] = React.useState({});
  const [working, setWorking] = React.useState({});

  /**
   * Add an alert to the dialog
   *
   * Parameters:
   *
   * id: A unique ID
   * alertProps: Bootstrap Alert props. See https://react-bootstrap.github.io/components/alerts/
   * content: The alert content
   */
  const addAlert = (id, alertProps, content) => {
    setAlerts({
      ...alerts,
      [id]: {
        props: alertProps,
        content,
      },
    });
  };

  const dismissAlert = (id) => {
    if (alerts[id]) {
      delete alerts[id];
      const newAlerts = {
        ...alerts,
      };
      setAlerts(newAlerts);
    }
  };

  const addWorking = (id, isWorking) => {
    setWorking({
      ...working,
      [id]: isWorking,
    });
  };

  const handleChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleChangeIndex = (index) => {
    setTabValue(index);
  };

  useLoadingUserTos(loadingUser, user, setUserTos, setError, setLoading);

  const wrapContent = (content) => {
    const renderedAlerts = [];

    _forEach(alerts, (alert, alertId) => {
      renderedAlerts.push(
        <Alert
          {...alert.props}
          key={alertId}
          dismissible
          onClose={() => {
            dismissAlert(alertId);
          }}
        >
          {alert.content}
        </Alert>
      );
    });

    return (
      <>
        <SimpleNavBar />
        <div className="container-fluid tos-page">
          <div>
            <br />
            <br />
            <br />
            <div className="margin-middle tos-body">
              {renderedAlerts}
              {content}
            </div>
          </div>
        </div>
      </>
    );
  };

  if (isLoading || loadingUser) {
    return loading;
  }

  if (error) {
    return wrapContent(<Alert variant="danger">{error}</Alert>);
  }

  const latestTos = {
    terms: {
      ...termsFrontMatter,
      type: "terms",
      component: Terms,
      sortOrder: 0,
    },
    acceptableUse: {
      ...aupFrontMatter,
      type: "acceptableUse",
      component: AcceptableUsePolicy,
      sortOrder: 1,
    },
    privacy: {
      ...privacyFrontMatter,
      type: "privacy",
      component: PrivacyPolicy,
      sortOrder: 2,
    },
  };

  const needsAccept = [];

  _forEach(latestTos, (tos, tosType) => {
    if (tos.lastUpdated !== userTos[tosType]) {
      needsAccept.push(tos);
    }
  });

  if (needsAccept.length) {
    needsAccept.sort((a, b) => {
      return a.sortOrder - b.sortOrder;
    });

    const firstTime = !Object.keys(userTos).length;
    let title = "";
    if (firstTime) {
      title =
        "In order to proceed, you must accept the following terms of service:";
    } else {
      title =
        "Our terms of service have been updated. In order to proceed, you must accept the following:";
    }

    const handleSubmit = async (event) => {
      event.preventDefault();

      const workId = "tos-agree-proceed";

      addWorking(workId, true);

      try {
        const updates = {};
        needsAccept.forEach((tos) => {
          updates[tos.type] = tos.lastUpdated;
        });
        await firebase
          .database()
          .ref(`/users/${user.wbid}/tos`)
          .update(updates);
        setUserTos({
          ...userTos,
          ...updates,
        });
      } catch (e) {
        addAlert(
          workId,
          {
            variant: "danger",
          },
          e.message
        );
      } finally {
        addWorking(workId, false);
      }
    };

    const content = (
      <form className={classes.root} onSubmit={handleSubmit}>
        <h1 className="h3">{title}</h1>
        <br />
        <TabContext value={String(tabValue)}>
          <AppBar position="static" color="default">
            <TabList
              value={tabValue}
              onChange={handleChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              {needsAccept.map((tos, i) => {
                return (
                  <Tab key={tos.type} value={String(i)} label={tos.tabLabel} />
                );
              })}
            </TabList>
          </AppBar>
          <SwipeableViews
            axis={muiTheme.direction === "rtl" ? "x-reverse" : "x"}
            index={Number(tabValue)}
            onChangeIndex={handleChangeIndex}
          >
            {needsAccept.map((tos, i) => {
              return (
                <TabPanel
                  key={tos.type}
                  value={String(i)}
                  dir={muiTheme.direction}
                  className={classes.tabPanel}
                >
                  <tos.component />
                </TabPanel>
              );
            })}
          </SwipeableViews>
          <div className={classes.actions}>
            <button
              type="submit"
              className="confirm-button"
              disabled={working["tos-agree-proceed"]}
            >
              Agree
            </button>
          </div>
        </TabContext>
      </form>
    );

    return wrapContent(content);
  }

  return children;
};

TosCheck.propTypes = {
  loading: PropTypes.node,
  children: PropTypes.node,
};

export default TosCheck;
