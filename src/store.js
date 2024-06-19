/**
 * Main store function
 */
import { createStore, applyMiddleware } from "redux";
import thunk from "redux-thunk";
import { composeWithDevTools } from "redux-devtools-extension/developmentOnly";
import * as Sentry from "@sentry/react";
import { createLogger } from "redux-logger";
import rootReducer from "./reducers";

function configureStore(initialState = {}) {
  let store;

  const sentryReduxEnhancer = Sentry.createReduxEnhancer();

  if (process.env.NODE_ENV === "production") {
    store = createStore(
      rootReducer,
      initialState,
      composeWithDevTools(applyMiddleware(thunk), sentryReduxEnhancer)
    );
  } else {
    store = createStore(
      rootReducer,
      initialState,
      composeWithDevTools(
        applyMiddleware(thunk, createLogger()),
        sentryReduxEnhancer
      )
    );
  }
  // For hot reloading reducers
  if (module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept("./reducers", () => {
      const nextReducer = require("./reducers").default; // eslint-disable-line global-require

      store.replaceReducer(nextReducer);
    });
  }

  return store;
}

export default configureStore;
