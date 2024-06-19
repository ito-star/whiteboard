import React from "react";
import clsx from "clsx";
import MoreHorizIcon from "@material-ui/icons/MoreHorizOutlined";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import firebase from "firebase/compat/app";
import "firebase/compat/database";
import Modal from "react-bootstrap/Modal";
import Avatar from "@material-ui/core/Avatar";

const Message = (props) => {
  const {
    isSender,
    counter,
    id,
    date,
    sender,
    message,
    board_id,
    block_id,
    profilePicture,
    isNew,
  } = props;
  const classExtension = isSender ? " self-sender" : "";
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [isEditOpen, setEditOpen] = React.useState(false);
  const [newMessage, setMessage] = React.useState(message);

  const showEditModal = () => {
    setEditOpen(true);
  };

  const hideEditModal = () => {
    setEditOpen(false);
  };

  const editMessage = () => {
    showEditModal();
  };

  const saveEditModal = () => {
    setEditOpen(false);
    const ref = firebase.database().ref(`chats/${board_id}/${block_id}/${id}`);
    ref.update({
      message: newMessage,
    });
  };
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  const deleteMessage = () => {
    const ref = firebase.database().ref(`chats/${board_id}/${block_id}/${id}`);
    ref.set({});
  };

  const didChangeInput = (e) => {
    const text = e.target.value;
    setMessage(text);
  };

  const isNewMessage = !isSender && isNew;

  return (
    <div
      key={`${counter}message${id}`}
      className={clsx("message-container", isNewMessage && "is-new")}
    >
      {isNewMessage && (
        <div className="new-badge-wrapper">
          <div className="new-badge">New</div>
        </div>
      )}
      <div className={`message${classExtension}`}>
        <div className="message-avatar">
          <Avatar src={profilePicture} alt={sender} />
        </div>
        <div className="message-content">
          <small className="message-sender">{sender}</small>
          <small className="message-date date-small">{date}</small>
          <p className="message-message">{message}</p>
        </div>
        {isSender && (
          <>
            <MoreHorizIcon onClick={handleClick} className="message-options" />
            <Menu
              id="simple-menu"
              anchorEl={anchorEl}
              keepMounted
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem
                onClick={() => {
                  handleMenuClose();
                  deleteMessage();
                }}
              >
                Delete
              </MenuItem>

              <MenuItem
                onClick={() => {
                  handleMenuClose();
                  editMessage();
                }}
              >
                Edit
              </MenuItem>
            </Menu>
            <Modal show={isEditOpen} onHide={hideEditModal}>
              <Modal.Header>
                <Modal.Title>Edit Message</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <input
                  autoComplete="off"
                  onChange={didChangeInput}
                  defaultValue={message}
                  className="form-control"
                  placeholder="think!"
                />
              </Modal.Body>
              <Modal.Footer>
                <button
                  className="neutral-button"
                  onClick={hideEditModal}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="confirm-button"
                  onClick={saveEditModal}
                  type="button"
                >
                  Save
                </button>
              </Modal.Footer>
            </Modal>
          </>
        )}
      </div>
    </div>
  );
};

export default Message;
