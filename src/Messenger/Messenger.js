import React, { Component } from "react";
import { compose } from "redux";
import firebase from "firebase/compat/app";
import "firebase/compat/database";
import $ from "jquery";
import Dayjs from "dayjs";
import SendIcon from "@material-ui/icons/SendOutlined";
import Button from "@material-ui/core/Button";
import clsx from "clsx";
import UserContext from "../auth/UserContext";
import { formatAMPM, updateBoardMetadata } from "../utils";
import Message from "./Message";
import withOnDatabaseEvent from "../withOnDatabaseEvent";
import "./Messenger.scss";

class Messenger extends Component {
  constructor(props) {
    super(props);

    this.state = {
      board_id: props.board_id,
      currentMessage: "",
      id: props.id,
      messages: [],
      profilePicture: null,
      isUserActive: false, // set true when user start typing to hide new message badge
    };

    this.sendMessage = this.sendMessage.bind(this);
    this.loadMessage = this.loadMessage.bind(this);
  }

  componentDidMount() {
    const { board_id, id } = this.state;
    const { onDatabaseEvent } = this.props;
    // eslint-disable-next-line no-extend-native
    String.prototype.applyXSSprotection = () => {
      return this.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    };

    const ref = firebase.database().ref(`chats/${board_id}/${id}`);
    onDatabaseEvent(ref, "value", this.loadMessage);

    const { user, loadingUser } = this.context;

    if (!loadingUser && user) {
      this.setState({
        display_name: user.displayName,
        sender_id: user.wbid,
        profilePicture: user.photoURL,
      });
    }
  }

  componentWillUnmount() {
    const { board_id, id } = this.state;
    const ref = firebase.database().ref(`chats/${board_id}/${id}`);
    ref.off("value", this.loadMessage);
  }

  loadMessage(snapshot) {
    // Instantiates the listener
    const { board_id, id, sender_id, isUserActive } = this.state;
    const { loggedInLastViewed } = this.props;
    const messages = [];
    let counter = 0;
    let isNewMessage = false;

    snapshot.forEach((snap) => {
      counter += 1;
      // configure the colors of each message
      const messageObj = snap.val();

      let dateString = "";

      if (!isNewMessage && Dayjs(messageObj.date).isAfter(loggedInLastViewed)) {
        isNewMessage = true;
      }

      if (messageObj.date) {
        const date = new Date(messageObj.date);
        const AMPM = formatAMPM(date);
        dateString = `${
          date.getMonth() + 1
        }-${date.getDate()}-${date.getFullYear()} ${AMPM}`;
      }

      messages.push(
        <Message
          isSender={messageObj.sender_id === sender_id}
          board_id={board_id}
          block_id={id}
          sender={messageObj.sender}
          message={messageObj.message}
          date={dateString}
          id={snap.key}
          key={snap.key}
          counter={counter}
          profilePicture={messageObj.profilePicture}
          isNew={!isUserActive && isNewMessage}
        />
      );
    });

    this.setState({ messages }, () => {
      // scroll to bottom on each new message.
      $(`#message-list${id}`).animate({ scrollTop: messages.length * 90 });
    });
  }

  sendMessage() {
    const {
      id,
      board_id,
      sender_id,
      display_name,
      profilePicture,
      currentMessage,
    } = this.state;
    const date = new Date().toJSON();
    const ref = firebase.database().ref(`chats/${board_id}/${id}/`);

    if (currentMessage === "") {
      return;
    }

    ref.push(
      {
        message: currentMessage,
        date,
        sender_id,
        sender: display_name,
        profilePicture,
      },
      () => {
        this.setState({ currentMessage: "" });
      }
    );
    updateBoardMetadata(board_id, sender_id);
  }

  handleSubmit = (event) => {
    event.preventDefault();
    const { onSendMessage } = this.props;

    this.sendMessage();

    if (onSendMessage) {
      onSendMessage();
    }
  };

  onInputChange = ({ target }) => {
    this.setState({ currentMessage: target.value, isUserActive: true });
  };

  getInputProps = () => {
    const { currentMessage, id } = this.state;

    return {
      type: "text",
      className: "messenger-wrapper-input",
      value: currentMessage,
      "aria-label": "Type your message here",
      placeholder: "Type your message here",
      id: `input_message${id}`,
      onChange: this.onInputChange,
      autoComplete: "off",
    };
  };

  getSubmitButtomProps = () => {
    const { currentMessage } = this.state;
    const disabled = !currentMessage;

    return {
      type: "submit",
      disabled,
    };
  };

  getSendIconClassName = () => {
    const { currentMessage } = this.state;
    return clsx({
      "messenger-wrapper-sendIcon": true,
      "messenger-wrapper-sendIcon_disabled": !currentMessage,
    });
  };

  render() {
    const { readOnly } = this.props;
    const { id, messages } = this.state;

    return (
      <div className="messenger">
        <div className="messenger-container">
          <div id={`message-list${id}`} className="messenger-list">
            {messages}
          </div>
          {!readOnly && (
            <form className="messenger-wrapper" onSubmit={this.handleSubmit}>
              <input {...this.getInputProps()} />
              <Button {...this.getSubmitButtomProps()}>
                <SendIcon className={this.getSendIconClassName()} />
              </Button>
            </form>
          )}
        </div>
      </div>
    );
  }
}

Messenger.contextType = UserContext;

const enhance = compose(withOnDatabaseEvent());

export default enhance(Messenger);
