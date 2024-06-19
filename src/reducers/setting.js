import {
  SET_COMPACT_TYPE,
  SET_HEADER_COLOR,
  SET_ORIGIN_HEADER_COLOR,
  SET_ORIGIN_BODY_COLOR,
  SET_BODY_COLOR,
  TOGGLE_FREEZE_STATUS,
  SET_ORIGIN_FREEZE_STATUS,
  TOGGLE_BEAUTIFY,
  SET_BOARD_PUBLIC_URLS,
  SET_BOARD_PROTECTED,
} from "../actions/actionTypes";
import { ThemeColors } from "../constant";

const initialState = {
  compactType: "vertical",
  headerColor: ThemeColors.NOCOLOR,
  originHeaderColor: ThemeColors.NOCOLOR,
  bodyColor: ThemeColors.NOCOLOR,
  originBodyColor: ThemeColors.NOCOLOR,
  freezeAll: false,
  beautify: false,
  publicUrl: null,
  friendlyUrl: null,
  isSecured: false,
};

export default function settingsReducer(state = initialState, action) {
  switch (action.type) {
    case SET_ORIGIN_FREEZE_STATUS:
      return {
        ...state,
        freezeAll: action.payload,
      };
    case SET_COMPACT_TYPE:
      return {
        ...state,
        compactType: action.payload,
      };
    case SET_HEADER_COLOR:
      return {
        ...state,
        headerColor: action.payload || initialState.headerColor,
      };
    case SET_ORIGIN_HEADER_COLOR:
      return {
        ...state,
        headerColor: action.payload || initialState.headerColor,
        originHeaderColor: action.payload || initialState.originHeaderColor,
      };
    case SET_BODY_COLOR:
      return {
        ...state,
        bodyColor: action.payload || initialState.bodyColor,
      };
    case SET_ORIGIN_BODY_COLOR:
      return {
        ...state,
        bodyColor: action.payload || initialState.bodyColor,
        originBodyColor: action.payload || initialState.originBodyColor,
      };
    case TOGGLE_FREEZE_STATUS:
      return {
        ...state,
        freezeAll: !state.freezeAll,
      };
    case TOGGLE_BEAUTIFY:
      return {
        ...state,
        beautify: !state.beautify,
      };

    case SET_BOARD_PUBLIC_URLS:
      return {
        ...state,
        uniqueUrl: action.payload.uniqueUrl,
        friendlyUrl: action.payload.friendlyUrl,
      };
    case SET_BOARD_PROTECTED:
      return {
        ...state,
        isSecured: action.payload,
      };
    default:
      return state;
  }
}
