import { connect } from "react-redux";
import { compose } from "redux";
import { withSnackbar } from "notistack";
import firebase from "firebase/compat/app";
import "firebase/compat/database";
import React, { Component, createRef } from "react";
import { Link, withRouter } from "react-router-dom";
import styled from "styled-components";
import Tooltip from "@material-ui/core/Tooltip";
import ArrowBackIcon from "@material-ui/icons/ArrowBackOutlined";
import Cookie from "js-cookie";
import {
  initFirebase,
  updateBoardMetadata,
  getCallableFbFunction,
  idToEmail,
  getBrandImageUrl,
} from "../utils";
import {
  setHeaderColor,
  setOriginHeaderColor,
  setBodyColor,
  setOriginBodyColor,
  setOriginFreezeStatus,
  setBoardPubicUrls,
  setBoardProtected,
} from "../actions/setting";
import { ThemeColors, isLightBodyColor } from "../constant";
import access from "../access";
import restrictedPage from "../auth/restrictedPage";
import Screen from "../Screen";
import BoardControlPanel from "./BoardControlPanel";
import UserContext from "../auth/UserContext";
import UserMenu from "../User/UserMenu";
import RateLimitErrorModal from "./RateLimitErrorModal";
import CurrentUsersViewing from "../CurrentUsersViewing";
import BoardAccessControl from "./AccessControl";
import withConfirm from "../withConfirm";
import withOnDatabaseEvent from "../withOnDatabaseEvent";
import Loader from "../components/Loader";
import withModal from "../withModal";
import "./Board.scss";

const Mousetrap = require("mousetrap");
require("mousetrap/plugins/pause/mousetrap-pause");

const Toolbar = styled.div`
  background-color: ${(props) => `${props.color} !important`};
  box-shadow: rgb(38, 57, 77) 0px 5px 11px -6px;
`;

class Board extends Component {
  constructor(props) {
    super(props);
    const { match } = this.props;

    this.state = {
      board_id: match.params.id,
      board_members: props.board_members,
      isProtected: false,
      isLoading: true,
      isLimited: false,
      brandImage: null,
    };
    this.didChangeTitle = this.didChangeTitle.bind(this);
    this.toolbarRef = createRef(null);
  }

  componentDidMount() {
    Mousetrap.unbind("alt+n");
    Mousetrap.unbind("alt+p");
    initFirebase();
    const { board_id } = this.state;
    const token = Cookie.get(`board-${board_id}`);
    const {
      setOriginHeaderColor: setOriginHeaderColorProps,
      modal: { showModal },
    } = this.props;
    const getBoardFunc = getCallableFbFunction("boards-getBoardDetails");

    getBoardFunc({ boardId: board_id, token, isBoardLoad: true })
      .then((res) => {
        const {
          limited,
          locked,
          headerColor,
          boardName,
          boardOwner, // used when a board locked or limited
          board_members = [], // maybe `undefined` when a board  is locked or limited
        } = res.data;

        getBrandImageUrl(boardOwner || board_members[0]).then((brandUrl) => {
          this.setState({ brandImage: brandUrl });
        });

        if (limited) {
          this.setState({
            auth: true,
            board_name: boardName,
            isLimited: true,
            isLoading: false,
          });

          setOriginHeaderColorProps(headerColor);
          showModal(RateLimitErrorModal, { formId: "rate-limit-error" });

          return;
        }

        if (locked) {
          this.setState({ isProtected: true, auth: true, isLoading: false });
          return;
        }

        this.handleRefresh();
      })
      .catch((error) => {
        if (
          error.code === "functions/permission-denied" ||
          error.code === "functions/unauthenticated"
        ) {
          this.goHome();
        }
      });
  }

  goHome = () => {
    const { history } = this.props;
    history.push("/");
  };

  componentWillUnmount() {
    Mousetrap.unbind("alt+n");
    Mousetrap.unbind("alt+l");
    Mousetrap.unbind("alt+p");
    Mousetrap.unbind("alt+s");

    this.cleanupConnectionRefs();
  }

  cleanupConnectionRefs = () => {
    if (this.boardConnectionRef) {
      this.boardConnectionRef.onDisconnect().cancel();
      this.boardConnectionRef.remove();
    }

    if (this.boardFullViewRef) {
      this.boardFullViewRef.onDisconnect().cancel();
      this.boardFullViewRef.remove();
    }
  };

  handleError = (error) => {
    const { enqueueSnackbar } = this.props;
    if (error.code === "PERMISSION_DENIED") {
      this.goHome();
    } else {
      // eslint-disable-next-line no-console
      console.log(error);

      this.setState({ isLoading: false });

      enqueueSnackbar(error.toString(), {
        variant: "error",
      });
    }
  };

  updateBoard = (boardData) => {
    const {
      board_name,
      board_header_color,
      boardBodyColor,
      board_members,
      isBoardFrozen,
      unique_url,
      friendly_url,
      password,
    } = boardData;
    const { user } = this.context;
    const {
      setOriginHeaderColor: setOriginHeaderColorProps,
      setOriginBodyColor: setOriginBodyColorProps,
      setOriginFreezeStatus: setOriginFreezeStatusProps,
      setBoardPubicUrls: setBoardPubicUrlsProps,
      setBoardProtected: setBoardProtectedProps,
    } = this.props;

    if (!board_members.includes(user.wbid)) {
      this.goHome();
      return;
    }

    setOriginHeaderColorProps(board_header_color);
    setOriginBodyColorProps(boardBodyColor);
    setOriginFreezeStatusProps(isBoardFrozen);
    setBoardPubicUrlsProps(unique_url, friendly_url);
    setBoardProtectedProps(!!password);

    document.title = `${board_name} | whatboard`;
    this.setState({
      board_name,
      board_members,
      auth: true,
      isProtected: false,
      isLoading: false,
    });
  };

  updateLastViewed = () => {
    const { user } = this.context;
    const { board_id } = this.state;
    const { onDatabaseEvent } = this.props;

    updateBoardMetadata(board_id, user.wbid, {
      updateLastModified: false,
      updateLastViewed: true,
    });

    const updateBoardDigestFunc = getCallableFbFunction(
      "boards-updateBoardDigest"
    );
    updateBoardDigestFunc({
      boardId: board_id,
      email: idToEmail(user.wbid),
      action: "view",
    });

    const dbConnectionRef = firebase.database().ref(".info/connected");
    onDatabaseEvent(dbConnectionRef, "value", this.watchConnection);
  };

  watchConnection = async (snap) => {
    // See https://firebase.google.com/docs/database/web/offline-capabilities
    const { user } = this.context;
    const { board_id, board_members } = this.state;

    const myConnectionsRef = firebase
      .database()
      .ref(`whiteboards/${board_id}/currentViewingUsers/${user.wbid}`);

    if (snap.val() === true) {
      // We're connected (or reconnected)! Do anything here that should happen only if online (or on reconnect)
      await myConnectionsRef.update({
        displayName: user.displayName,
        photoURL: user.photoURL || "",
      });
      this.boardConnectionRef = myConnectionsRef.child("connections").push();

      // When I disconnect, remove this device
      this.boardConnectionRef.onDisconnect().remove();

      // Add this device to my connections list
      // this value could contain info about the device or a timestamp too
      this.boardConnectionRef.set(true);

      if (access.isBoardOwner({ board_id, board_members }, user)) {
        this.boardFullViewRef = firebase
          .database()
          .ref(`whiteboards/${board_id}/fullViewId`);
        this.boardFullViewRef.onDisconnect().remove();
      }
    }
  };

  handleRefresh = () => {
    const { board_id } = this.state;
    const { onDatabaseEvent } = this.props;
    const ref = firebase.database().ref(`whiteboards/${board_id}`);
    onDatabaseEvent(
      ref,
      "value",
      (snapshot) => {
        if (!snapshot.exists()) {
          this.goHome();
          return;
        }

        this.updateBoard(snapshot.val());
      },
      this.handleError
    );

    ref.once(
      "value",
      (snap) => {
        if (!snap.exists()) {
          this.goHome();
          return;
        }

        this.updateBoard(snap.val());
        this.updateLastViewed(snap);
      },
      this.handleError
    );
  };

  handleBoardUnlock = () => {
    this.handleRefresh();
  };

  didChangeTitle(e) {
    const title = e.target.value;
    const { board_id } = this.state;
    firebase
      .database()
      .ref(`whiteboards/${board_id}`)
      .update({ board_name: title });
  }

  getToolbarContainer = () => {
    return this.toolbarRef.current;
  };

  canLoadBrandImage = () => {
    const { user } = this.context;
    const { board_members } = this.state;
    return access.canProtectBoard({ board_members }, user);
  };

  render() {
    const {
      auth,
      board_name,
      board_members,
      board_id,
      isProtected,
      isLoading,
      isLimited,
      brandImage,
    } = this.state;

    const { headerColor, match } = this.props;
    const { user } = this.context;
    const { wbid } = user;

    if (isLoading) {
      return <Loader isFullScreen />;
    }

    return (
      <>
        {auth === true && (
          <div className="">
            <Toolbar
              className={
                headerColor === ThemeColors.WHITE ||
                headerColor === ThemeColors.NOCOLOR
                  ? "tool-bar white"
                  : "tool-bar"
              }
              color={
                headerColor === ThemeColors.NOCOLOR
                  ? ThemeColors.WHITE
                  : headerColor
              }
            >
              <div className="tool-bar-left">
                <Tooltip title="Back to Dashboard">
                  <Link
                    className={
                      isLightBodyColor(headerColor)
                        ? "homebutton black"
                        : "homebutton white"
                    }
                    to="/"
                  >
                    <ArrowBackIcon />
                  </Link>
                </Tooltip>
                <div>
                  <img
                    className="brand-logo"
                    src={
                      brandImage ||
                      `/power-icon${
                        isLightBodyColor(headerColor) ? "" : "-dark"
                      }.png`
                    }
                    alt="board-brand-logo"
                  />
                </div>
                <p className="id_header hidden">
                  id : <strong id="user_id" />
                </p>
                <h1 id="board-title">
                  <input
                    spellCheck="false"
                    autoComplete="false"
                    onKeyUp={this.didChangeTitle}
                    className={
                      isLightBodyColor(headerColor)
                        ? "board-title-input white"
                        : "board-title-input"
                    }
                    defaultValue={board_name}
                  />
                </h1>
              </div>
              <div className="tool-bar-right">
                {!isProtected && board_members && (
                  <BoardControlPanel
                    id={match.params.id}
                    members={board_members}
                    name={board_name}
                    ref={this.toolbarRef}
                  />
                )}
                <div className="current-users-viewing-wrapper">
                  <CurrentUsersViewing
                    boardId={match.params.id}
                    loggedInUserEmail={wbid}
                  />
                </div>
                <UserMenu
                  isWithBoard
                  board_name={board_name}
                  board_id={board_id}
                />
              </div>
            </Toolbar>
            {!isLimited && (
              <>
                {isProtected ? (
                  <BoardAccessControl
                    boardId={board_id}
                    onUnlock={this.handleBoardUnlock}
                  />
                ) : (
                  <div className="container-fluid px-0">
                    <Screen
                      board_members={board_members}
                      board_name={board_name}
                      board_id={match.params.id}
                      toolbarContainer={this.getToolbarContainer()}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </>
    );
  }
}

const mapStateToProps = (state) => ({
  headerColor: state.setting.headerColor,
  originHeaderColor: state.setting.originHeaderColor,
  bodyColor: state.setting.bodyColor,
  originBodyColor: state.setting.originBodyColor,
});

Board.contextType = UserContext;

const enhance = compose(
  withSnackbar,
  connect(mapStateToProps, {
    setHeaderColor,
    setOriginHeaderColor,
    setBodyColor,
    setOriginBodyColor,
    setOriginFreezeStatus,
    setBoardPubicUrls,
    setBoardProtected,
  }),
  restrictedPage(),
  withOnDatabaseEvent(),
  withRouter,
  withConfirm(),
  withModal()
);

export default enhance(Board);
