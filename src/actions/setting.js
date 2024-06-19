import {
  SET_COMPACT_TYPE,
  SET_HEADER_COLOR,
  SET_BODY_COLOR,
  SET_ORIGIN_HEADER_COLOR,
  SET_ORIGIN_BODY_COLOR,
  SET_ORIGIN_FREEZE_STATUS,
  TOGGLE_FREEZE_STATUS,
  TOGGLE_BEAUTIFY,
  SET_BOARD_PUBLIC_URLS,
  SET_BOARD_PROTECTED,
} from "./actionTypes";

export const setCompactType = (type) => (dispatch) => {
  dispatch({
    type: SET_COMPACT_TYPE,
    payload: type,
  });
};

export const setHeaderColor = (color) => (dispatch) => {
  dispatch({
    type: SET_HEADER_COLOR,
    payload: color,
  });
};

export const setOriginHeaderColor = (color) => (dispatch) => {
  dispatch({
    type: SET_ORIGIN_HEADER_COLOR,
    payload: color,
  });
};

export const setBodyColor = (color) => (dispatch) => {
  dispatch({
    type: SET_BODY_COLOR,
    payload: color,
  });
};

export const setOriginBodyColor = (color) => (dispatch) => {
  dispatch({
    type: SET_ORIGIN_BODY_COLOR,
    payload: color,
  });
};
export const toggleFreezeAll = () => (dispatch) => {
  dispatch({
    type: TOGGLE_FREEZE_STATUS,
  });
};

export const setOriginFreezeStatus = (isBoardFrozen) => (dispatch) => {
  dispatch({
    type: SET_ORIGIN_FREEZE_STATUS,
    payload: isBoardFrozen,
  });
};

export const toggleBeautify = () => ({
  type: TOGGLE_BEAUTIFY,
});

export const setBoardPubicUrls = (uniqueUrl, friendlyUrl) => ({
  type: SET_BOARD_PUBLIC_URLS,
  payload: { uniqueUrl, friendlyUrl },
});

export const setBoardProtected = (isSecured) => ({
  type: SET_BOARD_PROTECTED,
  payload: isSecured,
});
