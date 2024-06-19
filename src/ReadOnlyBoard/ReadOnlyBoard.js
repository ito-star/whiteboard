import React, { Component } from "react";
import { connect } from "react-redux";
import { compose } from "redux";
import { withRouter } from "react-router-dom";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/database";
import Cookie from "js-cookie";
import "./ReadOnlyBoard.scss";
import styled from "styled-components";
import PropTypes from "prop-types";
import { withSnackbar } from "notistack";
import UserMenu from "../User/UserMenu";
import UserContext from "../auth/UserContext";
import Screen from "../Screen";
import BoardAccessControl from "../Board/AccessControl";
import {
  initFirebase,
  getQueryParams,
  getCallableFbFunction,
  getBrandImageUrl,
} from "../utils";
import { setHeaderColor, setOriginHeaderColor } from "../actions/setting";
import restrictedPage from "../auth/restrictedPage";
import { ThemeColors, isLightBodyColor } from "../constant";
import RateLimitErrorModal from "../Board/RateLimitErrorModal";
import withOnDatabaseEvent from "../withOnDatabaseEvent";
import withModal from "../withModal";
import Loader from "../components/Loader";
import NotFoundPage from "./NotFoundPage";

const Toolbar = styled.div`
  background-color: ${(props) => `${props.color} !important`};
  box-shadow: rgb(38, 57, 77) 0px 5px 11px -6px;
`;

initFirebase();

class ReadOnlyBoard extends Component {
  constructor(props) {
    super(props);
    const { match } = props;

    this.state = {
      board_id: match.params.id,
      readOnlyId: getQueryParams("invitation"),
      isProtected: false,
      isLoading: true,
      isNotFound: false,
      isLimited: false,
      brandImage: null,
    };
  }

  doNotFound() {
    this.setState({
      isNotFound: true,
    });
  }

  handleDbError = (error) => {
    const { enqueueSnackbar } = this.props;
    if (error.code === "PERMISSION_DENIED") {
      this.doNotFound();
    } else {
      // eslint-disable-next-line no-console
      console.log(error);

      enqueueSnackbar(error.toString(), {
        variant: "error",
      });
    }
  };

  async componentDidMount() {
    const {
      setOriginHeaderColor: setOriginHeaderColorProps,
      modal: { showModal },
    } = this.props;
    const { board_id, readOnlyId } = this.state;

    if (!readOnlyId) {
      this.doNotFound();
      return;
    }

    const { getCurrentOrAnonymousUser } = this.context;

    const user = await getCurrentOrAnonymousUser();

    try {
      const accessRef = firebase
        .database()
        .ref(`/readonly-access/${user.uid}/boards/${board_id}`);

      await accessRef.set(readOnlyId);
    } catch (e) {
      this.handleDbError(e);
      return;
    } finally {
      this.setState({
        isLoading: false,
      });
    }

    const token = Cookie.get(`board-${board_id}`);

    const getBoardFunc = getCallableFbFunction("boards-getBoardDetails");

    getBoardFunc({ boardId: board_id, token, isBoardLoad: true }).then(
      (res) => {
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
      }
    );
  }

  handleRefresh = async () => {
    const { board_id } = this.state;
    const {
      setOriginHeaderColor: setOriginHeaderColorProp,
      onDatabaseEvent,
    } = this.props;

    try {
      const ref = firebase.database().ref(`whiteboards/${board_id}`);
      const snap = await ref.once("value");

      if (!snap.exists()) {
        this.doNotFound();
        return;
      }
      const {
        board_name,
        board_header_color,
        boardBodyColor,
        board_members,
      } = snap.val();
      setOriginHeaderColorProp(board_header_color);

      document.title = `${board_name} | whatboard`;
      this.setState({
        board_name,
        board_members,
        auth: true,
        isProtected: false,
        boardBodyColor,
      });

      const dbConnectionRef = firebase.database().ref(".info/connected");
      onDatabaseEvent(dbConnectionRef, "value", this.watchConnection);
    } catch (e) {
      this.handleDbError(e);
    } finally {
      this.setState({
        isLoading: false,
      });
    }
  };

  handleBoardUnlock = () => {
    this.handleRefresh();
  };

  componentWillUnmount() {
    if (this.boardConnectionRef) {
      this.boardConnectionRef.onDisconnect().cancel();
      this.boardConnectionRef.remove();
    }
  }

  watchConnection = async (snap) => {
    // See https://firebase.google.com/docs/database/web/offline-capabilities
    const { board_id } = this.state;
    const { getCurrentOrAnonymousUser } = this.context;
    const { enqueueSnackbar } = this.props;
    const user = await getCurrentOrAnonymousUser();

    const myConnectionsRef = firebase
      .database()
      .ref(`whiteboards/${board_id}/currentViewingUsers/guest-${user.uid}`);

    if (snap.val() === true) {
      try {
        // We're connected (or reconnected)! Do anything here that should happen only if online (or on reconnect)
        await myConnectionsRef.update({
          displayName: "Guest",
          photoURL: "",
        });
        this.boardConnectionRef = myConnectionsRef.child("connections").push();

        // When I disconnect, remove this device
        this.boardConnectionRef.onDisconnect().remove();

        // Add this device to my connections list
        // this value could contain info about the device or a timestamp too
        this.boardConnectionRef.set(true);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log(error);

        enqueueSnackbar(error.toString(), {
          variant: "error",
        });
      }
    }
  };

  render() {
    const {
      auth,
      board_name,
      board_members,
      readOnlyId,
      board_id,
      boardBodyColor,
      isProtected,
      isLoading,
      isNotFound,
      isLimited,
      brandImage,
    } = this.state;

    const { headerColor, match } = this.props;
    const { currentUser } = firebase.auth();

    if (isLoading) {
      return <Loader isFullScreen />;
    }

    if (isNotFound) {
      return <NotFoundPage />;
    }

    const isBrightMode = isLightBodyColor(headerColor);

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
                <div>
                  <img
                    className="brand-logo"
                    src={
                      brandImage ||
                      `/power-icon${isBrightMode ? "" : "-dark"}.png`
                    }
                    alt="board-brand-logo"
                  />
                </div>
                <p className="id_header hidden">
                  id : <strong id="user_id" />
                </p>
                <h1 id="board-title">{board_name}</h1>
              </div>
              <div className="tool-bar-right">
                <UserMenu
                  isReportAvailable={currentUser && !currentUser.isAnonymous}
                  board_id={board_id}
                  readOnlyId={readOnlyId}
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
                      readOnlyId={readOnlyId}
                      readOnlyBodyColor={boardBodyColor}
                      readOnly
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

ReadOnlyBoard.contextType = UserContext;

ReadOnlyBoard.propTypes = {
  headerColor: PropTypes.string.isRequired,
  setOriginHeaderColor: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  headerColor: state.setting.headerColor,
  originHeaderColor: state.setting.originHeaderColor,
});

const enhance = compose(
  withSnackbar,
  connect(mapStateToProps, {
    setHeaderColor,
    setOriginHeaderColor,
  }),
  restrictedPage({ allowAnonymous: true }),
  withOnDatabaseEvent(),
  withRouter,
  withModal()
);

export default enhance(ReadOnlyBoard);
