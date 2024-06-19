import { SET_CURRENT_USER, GET_CURRENT_USER } from "./actionTypes";

export const setCurrentUser = (userData) => (dispatch) => {
  dispatch({
    type: SET_CURRENT_USER,
    payload: userData,
  });
};

export const getCurrentUser = () => (dispatch) => {
  dispatch({
    type: GET_CURRENT_USER,
    payload: {},
  });
};
