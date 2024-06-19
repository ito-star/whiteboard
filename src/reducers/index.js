/**
 * Root Reducer
 */
import { combineReducers } from "redux";
import setting from "./setting";
import user from "./user";

// TODO: we can add new reducers here
// import auth from './auth';

export default combineReducers({
  setting,
  user,
});
