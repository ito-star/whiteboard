import { GET_CURRENT_USER, SET_CURRENT_USER } from "../actions/actionTypes";

const initialState = {
  currentUser: {},
};

export default function userReducer(state = initialState, action) {
  switch (action.type) {
    case SET_CURRENT_USER:
      return {
        ...state,
        currentUser: action.payload,
      };
    case GET_CURRENT_USER:
      return {
        ...state,
      };
    default:
      return state;
  }
}
