import React from "react";
import { useLocation, matchPath, Link } from "react-router-dom";
import { createLocation } from "history";
import clsx from "clsx";

import { makeStyles } from "@material-ui/core/styles";
import {
  AppBar,
  Container,
  Drawer,
  Hidden,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  SwipeableDrawer,
  Toolbar,
} from "@material-ui/core";
import {
  AccountBoxOutlined as ProfileIcon,
  SecurityOutlined as SecurityIcon,
  MonetizationOnOutlined as BillingIcon,
  MenuOutlined as MenuIcon,
  ColorLensOutlined as ColorLensIcon,
} from "@material-ui/icons";
import ButtonLink from "../ButtonLink";
import SimpleNavBar from "../SimpleNavBar";
import Footer from "../Footer";

const drawerWidth = 240;

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
  },
  menuButton: {
    marginLeft: 30,
    [theme.breakpoints.up("md")]: {
      display: "none",
    },
  },
  drawer: {
    [theme.breakpoints.up("md")]: {
      width: drawerWidth,
      flexShrink: 0,
    },
  },
  drawerPaper: {
    width: drawerWidth,
  },
  drawerHeader: {
    fontSize: "28px",
    [theme.breakpoints.up("md")]: {
      display: "none",
    },
  },
  drawerContainer: {
    overflow: "auto",
  },
  drawerNav: {
    "& .MuiListItem-root.MuiButton-root": {
      borderRadius: 0,
    },
  },
  content: {
    flexGrow: 1,
  },
}));

const resolveToLocation = (to, currentLocation) =>
  typeof to === "function" ? to(currentLocation) : to;

const normalizeToLocation = (to, currentLocation) => {
  return typeof to === "string"
    ? createLocation(to, null, null, currentLocation)
    : to;
};

const ListItemLink = React.forwardRef((props, ref) => {
  const { route } = props;
  const currentLocation = useLocation();
  const toLocation = normalizeToLocation(
    resolveToLocation(route, currentLocation),
    currentLocation
  );

  const { pathname: path } = toLocation;
  // Regex taken from: https://github.com/pillarjs/path-to-regexp/blob/master/index.js#L202
  const escapedPath = path && path.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");

  const match = escapedPath
    ? matchPath(currentLocation.pathname, {
        path: escapedPath,
        exact: true,
      })
    : null;

  return (
    <li>
      <ListItem
        {...props}
        route={route}
        selected={!!match}
        component={ButtonLink}
        ref={ref}
      />
    </li>
  );
});

ListItemLink.propTypes = ListItem.propTypes;

// iOS is hosted on high-end devices. We can enable the backdrop transition without
// dropping frames. The performance will be good enough.
// So: <SwipeableDrawer disableBackdropTransition={false} />
const iOS =
  typeof navigator !== "undefined" &&
  /iPad|iPhone|iPod/.test(navigator.userAgent);

const Layout = (props) => {
  const { children } = props;
  const classes = useStyles();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerOpen = () => {
    setMobileOpen(true);
  };

  const handleDrawerClose = () => {
    setMobileOpen(false);
  };

  const drawer = (
    <>
      <Toolbar disableGutters>
        <h1 className={clsx("colored", classes.drawerHeader)}>
          <Link to="/">
            <img src="/logo.svg" alt="logo" /> whatboard
          </Link>
        </h1>
      </Toolbar>
      <div className={classes.drawerContainer}>
        <List disablePadding className={classes.drawerNav}>
          <ListItemLink route="/account" divider onClick={handleDrawerClose}>
            <ListItemIcon>
              <ProfileIcon />
            </ListItemIcon>
            <ListItemText primary="Profile" />
          </ListItemLink>
          <ListItemLink
            route="/account/branding"
            divider
            onClick={handleDrawerClose}
          >
            <ListItemIcon>
              <ColorLensIcon />
            </ListItemIcon>
            <ListItemText primary="Board Branding" />
          </ListItemLink>
          <ListItemLink
            route="/account/security"
            divider
            onClick={handleDrawerClose}
          >
            <ListItemIcon>
              <SecurityIcon />
            </ListItemIcon>
            <ListItemText primary="Security" />
          </ListItemLink>
          <ListItemLink route="/account/billing" onClick={handleDrawerClose}>
            <ListItemIcon>
              <BillingIcon />
            </ListItemIcon>
            <ListItemText primary="Billing" />
          </ListItemLink>
        </List>
      </div>
    </>
  );

  return (
    <div className={classes.root}>
      <AppBar
        position="fixed"
        className={classes.appBar}
        color="transparent"
        elevation={0}
      >
        <Toolbar disableGutters>
          <SimpleNavBar
            beforeLogo={
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerOpen}
                className={classes.menuButton}
              >
                <MenuIcon />
              </IconButton>
            }
          />
        </Toolbar>
      </AppBar>
      <div role="navigation" className={classes.drawer}>
        <Hidden mdUp implementation="js">
          <SwipeableDrawer
            variant="temporary"
            open={mobileOpen}
            disableBackdropTransition={!iOS}
            onOpen={handleDrawerOpen}
            onClose={handleDrawerClose}
            classes={{
              paper: classes.drawerPaper,
            }}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
          >
            {drawer}
          </SwipeableDrawer>
        </Hidden>
        <Hidden smDown implementation="css">
          <Drawer
            variant="permanent"
            open
            classes={{ paper: classes.drawerPaper }}
          >
            {drawer}
          </Drawer>
        </Hidden>
      </div>
      <div className={classes.content}>
        <Toolbar />
        <Container component="main" className="account-page">
          {children}
        </Container>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
