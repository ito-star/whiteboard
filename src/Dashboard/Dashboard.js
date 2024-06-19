import _get from "lodash/get";
import _isEmpty from "lodash/isEmpty";
import _orderBy from "lodash/orderBy";
import _isPlainObject from "lodash/isPlainObject";
import React, { Component } from "react";
import { compose } from "redux";
import { Link, withRouter } from "react-router-dom";
import firebase from "firebase/compat/app";
import "firebase/compat/database";
import $ from "jquery";
import Modal from "react-bootstrap/Modal";
import AddIcon from "@material-ui/icons/AddOutlined";
import ViewListIcon from "@material-ui/icons/ViewListOutlined";
import AppsIcon from "@material-ui/icons/AppsOutlined";
import Tooltip from "@material-ui/core/Tooltip";
import TextField from "@material-ui/core/TextField";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import Button from "@material-ui/core/Button";
import Dayjs from "dayjs";
import isSameOrAfterPlugin from "dayjs/plugin/isSameOrAfter";
import MediaQuery from "react-responsive";
import { withSnackbar } from "notistack";
import {
  emailToId,
  initFirebase,
  getCallableFbFunction,
  isDesktopWidth,
  downloadBoard,
  getBoardSortByKey,
  makeCaseInsensitiveIteratee,
  makeDateTimeIteratee,
  makeBoardColorsIteratee,
} from "../utils";
import TutorialPopper from "../components/TutorialPopper";
import { minDeviceWidth } from "../constant";
import access from "../access";
import UserMenu from "../User/UserMenu";
import UserBoardUsage from "../User/UserBoardUsage";
import restrictedPage from "../auth/restrictedPage";
import UserContext from "../auth/UserContext";
import AuthCheck from "../auth/AuthCheck";
import BoardTable from "./BoardTable";
import UsersTable from "./UsersTable";
import BoardItem from "../BoardItem";
import DashboardWelcomeScreen from "../DashboardWelcomeScreen";
import BoardCloneFormModal from "../BoardCloneFormModal";
import DashboardFilters from "../DashboardFilters/DashboardFilters";
import withOnDatabaseEvent from "../withOnDatabaseEvent/withOnDatabaseEvent";
import "./Dashboard.scss";
import DashboardSort from "../DashboardSort";
import Loader from "../components/Loader";
import {
  CreatingBoardLoader,
  CreatingBoardLoaderText,
} from "./Dashboard.styles";

Dayjs.extend(isSameOrAfterPlugin);

class Dashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      boards: [],
      createMode: false,
      downloadMode: false,
      editMode: false,
      filterBy: "ALL",
      hideTutorial: false,
      isCreatingBoard: false,
      isEmptyWhatboardSubmission: false,
      isOpen: false,
      listMode: !isDesktopWidth(),
      removeAndLeaveMode: false,
      removeIds: [],
      removeMode: false,
      searchKey: "",
      showUsers: false,
      sortBy: "ALL",
      users: [],
      viewMode: "Table View",
    };
    this.loadBoards = this.loadBoards.bind(this);
    this.createBoard = this.createBoard.bind(this);
    this.hideModal = this.hideModal.bind(this);
    this.showModal = this.showModal.bind(this);
    this.createBtnRef = React.createRef(null);
    this.textField = React.createRef();
  }

  componentDidMount() {
    initFirebase();
    document.title = "whatboard";

    const { onDatabaseEvent } = this.props;
    const { user } = this.context;
    const { wbid } = user;

    const ref = firebase.database().ref(`users/${wbid}/whiteboards`);
    onDatabaseEvent(ref, "value", (snapshot) => {
      this.updateBoards(snapshot);
    });

    if (access.canAccessUsersReport(user)) {
      const getAllUsers = getCallableFbFunction("users-getAllUsers");

      getAllUsers().then((res) => {
        this.setState({ users: res.data });
      });
    }
  }

  getInitialModalModes = () => {
    return {
      leaveMode: false,
      removeAndLeaveMode: false,
      removeMode: false,
      editMode: false,
      cloneMode: false,
      createMode: false,
    };
  };

  showRemoveModal = (removeIds) => {
    const { user } = this.context;
    const { boards } = this.state;
    let removalMode;
    let containsLeaveBoard = false;
    let containsRemoveBoard = false;

    if (removeIds.length === 1) {
      const removalBoard = boards.filter((board) => {
        return board.board_id === removeIds[0];
      })[0];
      removalMode = access.canLeaveBoard(removalBoard, user)
        ? "leaveMode"
        : "removeMode";
    } else {
      const removalBoard = boards.filter((board) => {
        return removeIds.includes(board.board_id);
      });
      removalBoard.forEach((board) => {
        if (access.canLeaveBoard(board, user)) {
          containsLeaveBoard = true;
        } else {
          containsRemoveBoard = true;
        }
      });

      if (containsLeaveBoard && !containsRemoveBoard) {
        removalMode = "leaveMode";
      } else if (!containsLeaveBoard && containsRemoveBoard) {
        removalMode = "removeMode";
      } else {
        removalMode = "removeAndLeaveMode";
      }
    }

    this.setState({
      ...this.getInitialModalModes(),
      isOpen: true,
      [removalMode]: true,
      removeIds,
    });
  };

  showCloneModal = (cloneBoard) => {
    this.setState({
      ...this.getInitialModalModes(),
      isOpen: true,
      cloneMode: true,
      cloneBoard,
    });
  };

  showEditModal = (editBoard) => {
    this.setState({
      ...this.getInitialModalModes(),
      isOpen: true,
      editMode: true,
      editBoard,
    });
  };

  handleKeyDown = (event) => {
    if (event.keyCode === 13) {
      this.saveCreateModal();
    }
  };

  saveCreateModal = () => {
    if ($("#whiteboard_name").val()) {
      this.setState({ isEmptyWhatboardSubmission: false });
      this.createBoard($("#whiteboard_name").val());
      this.hideModal();
    } else {
      this.setState({ isEmptyWhatboardSubmission: true });
    }
  };

  saveEditModal = () => {
    const { editBoard, boards } = this.state;
    const index = boards.findIndex((board) => {
      return board.board_id === editBoard.board_id;
    });
    const boardsItems = [...boards];
    const item = {
      ...boards[index],
      board_name: $("#whiteboard_name_modal_input").val(),
    };
    boardsItems[index] = item;

    if ($("#whiteboard_name").val()) {
      this.setState({ isEmptyWhatboardSubmission: false });
      firebase
        .database()
        .ref(`/whiteboards/${editBoard.board_id}`)
        .update({ board_name: $("#whiteboard_name_modal_input").val() });
      this.setState({ boards: boardsItems });
      this.hideModal();
    } else {
      this.setState({ isEmptyWhatboardSubmission: true });
    }
  };

  saveRemovalModal = async () => {
    const { user } = this.context;
    const { boards, removeIds, downloadMode } = this.state;
    const leaveBoards = [];
    const removeBoards = [];
    const updates = {};
    const removalBoard = boards.filter((board) => {
      return removeIds.includes(board.board_id);
    });
    let newBoardMembers;
    let downloadPromises = [];

    removalBoard.forEach((board) => {
      if (access.canLeaveBoard(board, user)) {
        leaveBoards.push(board);
      } else {
        removeBoards.push(board);
      }
    });
    if (leaveBoards.length > 0) {
      leaveBoards.forEach((board) => {
        newBoardMembers = board.board_members.filter(
          (elem) => elem !== emailToId(user.email)
        );
        updates[
          `/whiteboards/${board.board_id}/board_members`
        ] = newBoardMembers;
        updates[`/users/${user.wbid}/whiteboards/${board.board_id}`] = {};
      });

      if (downloadMode) {
        downloadPromises = downloadPromises.concat(
          leaveBoards.map((board) =>
            downloadBoard(board.board_id, board.board_name)
          )
        );
      }
    }
    if (removeBoards.length > 0) {
      removeBoards.forEach((board) => {
        updates[`/whiteboards/${board.board_id}`] = null;
        updates[`/users/${user.wbid}/whiteboards/${board.board_id}`] = {};
      });

      if (downloadMode) {
        downloadPromises = downloadPromises.concat(
          removeBoards.map((board) => {
            return downloadBoard(board.board_id, board.board_name);
          })
        );
      }
    }

    if (downloadMode) {
      await Promise.all(downloadPromises);
    }

    firebase.database().ref().update(updates);

    if (boards.length - removeBoards.length === 0) {
      this.setState({
        listMode: false,
      });
    }

    this.hideModal();
  };

  saveRemoveModal = () => {
    const updates = {};
    const { user } = this.context;
    const { removeIds } = this.state;

    removeIds.forEach((id) => {
      updates[`/whiteboards/${id}`] = null;
      updates[`/users/${user.wbid}/whiteboards/${id}`] = null;
    });
    firebase.database().ref().update(updates);
    this.hideModal();
  };

  saveLeaveModal = () => {
    const { user } = this.context;
    const { removeIds, boards } = this.state;
    const board_id = removeIds[0];
    const removalBoard = boards.filter((board) => {
      return board.board_id === removeIds[0];
    })[0];
    let newBoardMembers = removalBoard.board_members;

    newBoardMembers = newBoardMembers.filter(
      (elem) => elem !== emailToId(user.email)
    );
    firebase.database().ref(`/whiteboards/${board_id}`).update({
      board_members: newBoardMembers,
    });
    firebase
      .database()
      .ref(`/users/${user.wbid}/whiteboards/${board_id}`)
      .set({});

    this.hideModal();
    this.setState({
      listMode: false,
    });
  };

  toggleViewMode = () => {
    const { listMode } = this.state;

    this.setState({
      viewMode: listMode ? "List View" : "Grid View",
      listMode: !listMode,
    });
  };

  toggleUsersViewMode = () => {
    const { showUsers } = this.state;

    this.setState({
      showUsers: !showUsers,
    });
  };

  closeTutorial = () => {
    this.setState({ hideTutorial: true });
  };

  renderContent = () => {
    let content = null;
    const { listMode, showUsers, users, boards, searchKey } = this.state;

    const filteredBoardData = boards.filter(
      (board) => board && board.board_name.toLowerCase().includes(searchKey)
    );

    const unpinnedBoards = filteredBoardData.filter(
      (board) => !board.pinned || board.pinned === undefined
    );

    const pinnedBoards = filteredBoardData.filter((board) => board.pinned);

    if (listMode) {
      content = (
        <>
          <BoardTable
            title="Pinned Boards"
            data={pinnedBoards}
            onEditBoard={this.showEditModal}
            onRemoveBoards={this.showRemoveModal}
            onCloneBoard={this.showCloneModal}
          />
          <BoardTable
            title="Boards"
            data={unpinnedBoards}
            onEditBoard={this.showEditModal}
            onRemoveBoards={this.showRemoveModal}
            onCloneBoard={this.showCloneModal}
          />
        </>
      );
    } else if (showUsers) {
      content = (
        <UsersTable
          data={users}
          onEditBoard={this.showEditModal}
          onRemoveBoards={this.showRemoveModal}
          onCloneBoard={this.showCloneModal}
        />
      );
    } else {
      content = (
        <>
          <div className="pinned-boards">
            {this.renderBoardItem(pinnedBoards)}
          </div>
          <div id="boards" className="boards">
            {this.renderBoardItem(unpinnedBoards)}
          </div>
        </>
      );
    }

    return content;
  };

  loadBoards = async () => {
    const { user } = this.context;
    const { wbid } = user;
    const snapshot = await firebase
      .database()
      .ref(`users/${wbid}/whiteboards`)
      .once("value");

    await this.updateBoards(snapshot);
  };

  isModifiedAfterLastViewed = (metadata, view_logs) => {
    if (!view_logs || !metadata) {
      return false;
    }

    const { user } = this.context;
    const { wbid } = user;
    const boardLastModified = _get(metadata, "lastModified");
    const userLastViewed = _get(view_logs, `${[wbid]}.lastViewed`);

    if (
      (!_isEmpty(boardLastModified) &&
        Dayjs(boardLastModified).isAfter(Dayjs(userLastViewed))) ||
      (!userLastViewed && boardLastModified)
    ) {
      return boardLastModified;
    }

    return false;
  };

  isViewedAfterLoggedinUser = (board_members, view_logs) => {
    if (!board_members || !view_logs) {
      return false;
    }

    const { user } = this.context;
    const { wbid } = user;
    const loggedInUserLastViewed = _get(view_logs, `${[wbid]}.lastViewed`);
    const boardMembersMinusLoggedInUser = board_members.filter(
      (member) => member !== user.wbid
    );
    let isViewedAfterLoggedin = false;

    for (let i = 0; i < boardMembersMinusLoggedInUser.length; i += 1) {
      const boardMember = boardMembersMinusLoggedInUser[i];
      const boardMemberLastViewed = view_logs[boardMember]?.lastViewed;
      if (
        !loggedInUserLastViewed === "cleared" ||
        (boardMemberLastViewed &&
          (!loggedInUserLastViewed ||
            Dayjs(boardMemberLastViewed).isSameOrAfter(
              Dayjs(loggedInUserLastViewed)
            )))
      ) {
        isViewedAfterLoggedin = boardMemberLastViewed;
        break;
      }
    }

    return isViewedAfterLoggedin;
  };

  getFilterTags = (board) => {
    const filterTags = [];
    const { user } = this.context;
    const { wbid } = user;
    const { metadata, view_logs, board_members, password } = board;

    if (board.isArchived) {
      filterTags.push("ARCHIVED");
    }
    if (board.board_members.length > 1) {
      if (board.board_members[0] === wbid) {
        filterTags.push("SHAREDBYYOU");
      } else {
        filterTags.push("SHAREDWITHYOU");
      }
    }
    if (board.unique_url) {
      filterTags.push("PUBLIC");
    }
    if (this.isModifiedAfterLastViewed(metadata, view_logs)) {
      filterTags.push("MODIFIED");
    }
    if (this.isViewedAfterLoggedinUser(board_members, view_logs)) {
      filterTags.push("VIEWED");
    }

    if (password) {
      filterTags.push("LOCKED");
    }

    return filterTags;
  };

  renderBoardItem = (boardsParam, index) => {
    const { filterBy } = this.state;

    return boardsParam
      .filter(
        ({ filterTags, isArchived }) =>
          filterTags.includes(filterBy) || (filterBy === "ALL" && !isArchived)
      )
      .map(
        ({
          board_name,
          board_members,
          date_created,
          unique_url,
          friendly_url,
          isArchived,
          board_id,
          filterTags,
          metadata,
          view_logs,
          pinned,
          password,
          board_header_color,
          boardBodyColor,
          loadLimit,
        }) => (
          <BoardItem
            key={board_id}
            board_members={board_members}
            isArchived={isArchived}
            board_name={board_name}
            board_id={board_id}
            pinned={pinned}
            board_header_color={board_header_color}
            boardBodyColor={boardBodyColor}
            isPublic={!!unique_url}
            index={index}
            filterTags={filterTags}
            isModifiedAfterLastViewed={this.isModifiedAfterLastViewed(
              metadata,
              view_logs
            )}
            isViewedAfterLoggedinUser={this.isViewedAfterLoggedinUser(
              board_members,
              view_logs
            )}
            unique_url={unique_url}
            friendly_url={friendly_url}
            date_created={date_created}
            onCreatingBoard={this.onCreatingBoard}
            onCreateBoardSuccess={this.onCreateBoardSuccess}
            onCreateBoardError={this.onCreateBoardError}
            isSecured={!!password}
            isLimited={!loadLimit}
          />
        )
      );
  };

  updateBoards = async (snapshot) => {
    let updatedBoards = [];
    const { sortBy } = this.state;

    if (snapshot.val()) {
      const userBoards = Object.values(snapshot.val());
      const boardkeys = Object.keys(snapshot.val());
      updatedBoards = await Promise.all(
        boardkeys.map(async (board_id, index) => {
          const boardSnapShot = await firebase
            .database()
            .ref(`whiteboards/${board_id}`)
            .once("value");

          const boardValue = boardSnapShot.val();

          if (!_isPlainObject(boardValue)) {
            // eslint-disable-next-line no-console
            console.warn(
              `DB entry /whiteboards/${board_id} contains invalid data. Skipping...`
            );
            return Promise.resolve();
          }

          const { unique_url, metadata, view_logs, friendly_url } = boardValue;
          const additionalData = {
            unique_url,
            board_id,
            metadata,
            view_logs,
            friendly_url,
          };
          const boardData = { ...userBoards[index], ...additionalData };

          return {
            ...boardData,
            filterTags: this.getFilterTags(boardData, additionalData),
          };
        })
      );
      updatedBoards = updatedBoards.filter(Boolean);
    }

    if (sortBy !== "ALL") {
      const sortByKey = getBoardSortByKey(sortBy);
      const order =
        sortBy === "Z-TO-A" || sortBy === "BOARD-NEWEST-FIRST" ? "desc" : "asc";
      let iteratee;

      if (sortBy === "A-TO-Z" || sortBy === "Z-TO-A") {
        iteratee = makeCaseInsensitiveIteratee(sortByKey);
      } else if (sortBy === "COLORS") {
        iteratee = makeBoardColorsIteratee(sortByKey);
      } else if (
        sortBy === "BOARD-OLDEST-FIRST" ||
        sortBy === "BOARD-NEWEST-FIRST"
      ) {
        iteratee = makeDateTimeIteratee(sortByKey);
      }

      updatedBoards = _orderBy(updatedBoards, [iteratee], [order]);
    }

    this.setState({ boards: updatedBoards, loaded: true });
  };

  canCreateBoards = (user) => {
    return access.canCreateBoards(user);
  };

  handleSelectFilterDropdown = (filterDropdown) => {
    this.setState({ filterBy: filterDropdown }, () => this.loadBoards());
  };

  handleSelectSortDropdown = (sortDropdown) => {
    this.setState({ sortBy: sortDropdown }, () => this.loadBoards());
  };

  handleFilterSearch = (filterSearch) => {
    this.setState({ searchKey: filterSearch });
  };

  handleClearStatus = async () => {
    const { user } = this.context;
    const { boards } = this.state;
    const updateLastViewed = {};

    for (let x = 0; x < boards.length; x += 1) {
      updateLastViewed[
        `whiteboards/${boards[x].board_id}/view_logs/${user.wbid}/lastViewed`
      ] = "cleared";
    }

    await firebase.database().ref().update(updateLastViewed);

    // TODO - Refactor Dashboard.js, It's making to many database calls and not utilizing state correctly
    this.loadBoards();
  };

  onCreatingBoard = () => {
    this.setState({ isCreatingBoard: true });
  };

  onCreateBoardSuccess = (data) => {
    const { newBoardId } = data;
    this.goToBoard(newBoardId);
  };

  onCreateBoardError = (error) => {
    const { enqueueSnackbar } = this.props;
    this.setState({ isCreatingBoard: false });

    // eslint-disable-next-line no-console
    console.error(error);

    enqueueSnackbar(error.toString(), {
      variant: "error",
    });
  };

  goToBoard(boardId) {
    const { history } = this.props;
    history.push(`/board/${boardId}`);
  }

  async createBoard(name) {
    const { user } = this.context;
    const limits = access.getMaxBoardLoads(user);
    const ref = firebase.database().ref(`users/${user.wbid}/whiteboards`);
    const newBoard = {
      board_name: name,
      board_members: [user.wbid],
      date_created: new Date().toJSON(),
      loadLimit: limits,
      board_header_color: user.branding.boardHeaderColor,
      boardBodyColor: user.branding.boardBodyColor,
    };

    this.onCreatingBoard();

    try {
      const snap = await ref.push(newBoard);
      const newRef = firebase.database().ref(`whiteboards/${snap.key}`);
      await newRef.update(newBoard);

      this.onCreateBoardSuccess({
        newBoardId: snap.key,
      });
    } catch (e) {
      this.onCreateBoardError(e);
    }
  }

  showModal() {
    this.setState({ isOpen: true, createMode: true });
  }

  hideModal() {
    this.setState({
      ...this.getInitialModalModes(),
      isOpen: false,
      isEmptyWhatboardSubmission: false,
      editBoard: null,
      removeIds: [],
    });
  }

  handleNextTutorial = () => {
    this.showModal();
  };

  renderModal() {
    const { user } = this.context;
    const {
      isOpen,
      createMode,
      removeMode,
      loaded,
      leaveMode,
      removeAndLeaveMode,
      editMode,
      cloneMode,
      cloneBoard,
      editBoard,
      downloadMode,
      removeIds,
      isEmptyWhatboardSubmission,
    } = this.state;

    if (cloneMode) {
      return (
        <BoardCloneFormModal
          onSubmitting={this.onCreatingBoard}
          onSuccess={this.onCreateBoardSuccess}
          onError={this.onCreateBoardError}
          board_id={cloneBoard.board_id}
          board_members={cloneBoard.board_members}
          board_name={cloneBoard.board_name}
          modalProps={{
            show: isOpen,
            onHide: () => {
              this.hideModal();
            },
          }}
        />
      );
    }

    const createModeFallback = (
      <p>
        You have reached the maximum number of allowed boards for your account.
      </p>
    );

    const thisWhatboard =
      removeIds.length === 1 ? "this whatboard" : "these whatboards";
    let removal;

    if (removeMode) {
      removal = "removal";
    } else if (leaveMode) {
      removal = "departure";
    } else if (removeAndLeaveMode) {
      removal = "removal/departure";
    }

    return (
      <Modal
        show={isOpen}
        onHide={this.hideModal}
        onEntered={() => this.textField?.current?.focus()}
      >
        <Modal.Header>
          {createMode && (
            <AuthCheck accessCheck={this.canCreateBoards}>
              <Modal.Title>What shall we call your whatboard?</Modal.Title>
            </AuthCheck>
          )}
          {removeMode && (
            <Modal.Title>
              {`Are you sure you want to remove ${thisWhatboard}?`}
            </Modal.Title>
          )}
          {leaveMode && (
            <Modal.Title>
              {`Are you sure you want to leave ${thisWhatboard}?`}
            </Modal.Title>
          )}
          {removeAndLeaveMode && (
            <Modal.Title>
              Are you sure you want to remove your boards and leave the shared
              whatboards?
            </Modal.Title>
          )}
          {editMode && <Modal.Title>Rename Whatboard</Modal.Title>}
        </Modal.Header>
        <Modal.Body>
          {(removeMode || leaveMode) && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={downloadMode}
                  onChange={(e) =>
                    this.setState({ downloadMode: e.target.checked })
                  }
                  name="download-check-box"
                />
              }
              label={`Download ${thisWhatboard} before ${removal}`}
            />
          )}
          {editMode && (
            <TextField
              error={isEmptyWhatboardSubmission}
              defaultValue={editBoard.board_name}
              id="whiteboard_name_modal_input"
              className="form-control"
              ref={this.textField}
              helperText={
                isEmptyWhatboardSubmission
                  ? "Whatboard name can't be empty"
                  : null
              }
            />
          )}
          {createMode && loaded && (
            <>
              <AuthCheck
                accessCheck={this.canCreateBoards}
                fallback={createModeFallback}
              >
                <>
                  <TextField
                    error={isEmptyWhatboardSubmission}
                    defaultValue="my whatboard"
                    id="whiteboard_name"
                    inputRef={this.textField}
                    className="form-control"
                    helperText={
                      isEmptyWhatboardSubmission
                        ? "Whatboard name can't be empty"
                        : null
                    }
                    onKeyDown={this.handleKeyDown}
                  />
                </>
              </AuthCheck>
              <br />
              <br />
              <UserBoardUsage />
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            className="neutral-button margined-button"
            onClick={this.hideModal}
            type="submit"
          >
            Cancel
          </Button>
          {createMode && (
            <Button
              className="confirm-button margined-button"
              onClick={this.saveCreateModal}
              type="submit"
              disabled={!this.canCreateBoards(user)}
            >
              Create Board
            </Button>
          )}
          {(leaveMode || removeMode || removeAndLeaveMode) && (
            <Button
              className="cancel-button"
              onClick={this.saveRemovalModal}
              type="submit"
            >
              {leaveMode ? "Leave" : "Remove"}
            </Button>
          )}
          {editMode && (
            <Button
              className="confirm-button"
              onClick={this.saveEditModal}
              type="submit"
            >
              Save
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    );
  }

  render() {
    const { user } = this.context;
    const {
      loaded,
      viewMode,
      listMode,
      showUsers,
      users,
      boards,
      isCreatingBoard,
      hideTutorial,
    } = this.state;

    if (!loaded) {
      return <Loader isFullScreen />;
    }

    return (
      <div className="container-fluid">
        {user.tutorialStep === 1 && !hideTutorial && (
          <TutorialPopper
            popperAnchor={this.createBtnRef.current}
            onClose={this.closeTutorial}
            onTry={this.handleNextTutorial}
            placement="bottom-start"
          />
        )}
        {isCreatingBoard && (
          <CreatingBoardLoader>
            <CreatingBoardLoaderText>
              Creating your new board...
            </CreatingBoardLoaderText>
          </CreatingBoardLoader>
        )}
        {loaded && (
          <>
            {this.renderModal()}
            <nav className="dashboard-nav">
              <div className="dashboard-nav-left">
                <h1 className="colored">
                  <Link to="/">
                    <img src="/logo.svg" alt="logo" />
                  </Link>
                </h1>

                <MediaQuery minWidth={minDeviceWidth}>
                  {access.canAccessUsersReport(user) && (
                    <button
                      onClick={this.toggleUsersViewMode}
                      type="button"
                      className="view_button"
                    >
                      {showUsers
                        ? "Close users table - "
                        : "Open users table - "}{" "}
                      {`Total Users: ${users.length}`}
                    </button>
                  )}
                  <Button
                    color="primary"
                    onClick={this.showModal}
                    className="add-board-button confirm-button"
                    ref={this.createBtnRef}
                    startIcon={<AddIcon />}
                  >
                    Create New
                  </Button>
                  <DashboardFilters
                    onSelectFilterDropdown={this.handleSelectFilterDropdown}
                    onFilterSearch={this.handleFilterSearch}
                  />
                  <DashboardSort
                    onSelectSortDropdown={this.handleSelectSortDropdown}
                  />
                  <Button
                    color="primary"
                    onClick={this.handleClearStatus}
                    className="clear-status_button confirm-button"
                  >
                    Clear Status
                  </Button>
                  <Tooltip title={viewMode}>
                    <button
                      onClick={this.toggleViewMode}
                      type="button"
                      className="view_button"
                    >
                      {listMode ? <AppsIcon /> : <ViewListIcon />}
                    </button>
                  </Tooltip>
                </MediaQuery>
              </div>
              <div className="dashboard-nav-right">
                <UserMenu />
              </div>
            </nav>
            {this.renderContent()}
            {boards.length === 0 && <DashboardWelcomeScreen />}
          </>
        )}
      </div>
    );
  }
}

Dashboard.contextType = UserContext;

const enchance = compose(
  restrictedPage(),
  withOnDatabaseEvent(),
  withRouter,
  withSnackbar
);

export default enchance(Dashboard);
