import firebase from "firebase/compat/app";
import "firebase/compat/database";
import React from "react";
import {
  Button,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  TextField,
  Portal,
  FormControlLabel,
  Checkbox,
  Tooltip,
} from "@material-ui/core";
import { useSnackbar } from "notistack";
import Dayjs from "dayjs";
import pMap from "p-map";
import SendIcon from "@material-ui/icons/SendOutlined";
import RemoveCircleOutlineIcon from "@material-ui/icons/RemoveCircleOutlineOutlined";
import ExpandMoreIcon from "@material-ui/icons/ExpandMoreOutlined";
import HelpOutlineOutlinedIcon from "@material-ui/icons/HelpOutlineOutlined";
import Form from "react-bootstrap/Form";
import _includes from "lodash/includes";
import arrify from "arrify";
import PopupState, { bindTrigger, bindMenu } from "material-ui-popup-state";
import AddressAutoComplete from "../AddressAutoComplete";
import {
  emailToId,
  idToEmail,
  getCallableFbFunction,
  createUUID,
} from "../utils";
import useUser from "../auth/useUser";

import "./InviteForm.scss";

const InviteForm = (props) => {
  const getMemberlastModified = async (board_id) => {
    const membersLastSnap = await firebase
      .database()
      .ref(`whiteboards/${board_id}/view_logs`)
      .once("value");

    return membersLastSnap.val();
  };

  const getShouldTrackVisits = async (board_id) => {
    const shouldTrackSnap = await firebase
      .database()
      .ref(`whiteboards/${board_id}/shouldTrackVisits`)
      .once("value");

    return shouldTrackSnap.val();
  };

  const { user } = useUser();
  const {
    board_members: boardMembersProp,
    board_id,
    board_name,
    formProps: formPropsInput,
    notifySubmitting,
    portalContainer,
  } = props;
  const [boardMembers, setBoardMembers] = React.useState(boardMembersProp);
  const [memberslastModified, setMemberslastModified] = React.useState({});
  const [formVals, setFormVals] = React.useState({
    email: [],
    subject: `${user.displayName} has invited you to the Whatboard "${board_name}"`,
  });
  const [working, setWorking] = React.useState({});
  const [submitting, setSubmitting] = React.useState(false);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const [shouldTrackReport, setShouldTrackReport] = React.useState(false);

  React.useEffect(() => {
    getMemberlastModified(board_id).then((viewLogs) => {
      setMemberslastModified(viewLogs || {});
    });

    getShouldTrackVisits(board_id).then((shouldTrack) => {
      setShouldTrackReport(shouldTrack);
    });
  }, [board_id]);

  const addWorking = (id, isWorking) => {
    const newWorking = {
      ...working,
      [id]: isWorking,
    };
    const isSubmitting = _includes(newWorking, true);
    setWorking(newWorking);
    setSubmitting(isSubmitting);
    notifySubmitting(isSubmitting);
  };

  const removeMember = (member, workId) => {
    addWorking(workId, true);

    let newBoardMembers = boardMembers;
    const newMemberslastModified = memberslastModified;
    const emailId = emailToId(member);
    newBoardMembers = newBoardMembers.filter((elem) => elem !== emailId);
    delete newMemberslastModified[emailId];

    const ref = firebase.database().ref();
    const updatedBoardMembers = {};
    updatedBoardMembers[
      `whiteboards/${board_id}/board_members`
    ] = newBoardMembers;
    updatedBoardMembers[`whiteboards/${board_id}/view_logs/${emailId}`] = null;

    ref.update(updatedBoardMembers, () => {
      setBoardMembers(newBoardMembers);
      setMemberslastModified(newMemberslastModified);
      addWorking(workId, false);
    });
  };

  const addMember = async (inEmails = [], subject, workId) => {
    try {
      const emails = arrify(inEmails).filter(Boolean);

      if (!emails.length) {
        return;
      }

      addWorking(workId, true);

      const newBoardMembers = [...boardMembers];
      const newMemberslastModified = { ...memberslastModified };
      const updatedBoardMembers = {};
      let hasNew = false;

      emails.forEach((email) => {
        const id = emailToId(email);
        const existing = newBoardMembers.includes(id);

        if (!existing) {
          hasNew = true;
          newMemberslastModified[id] = {
            lastModified: new Date().toJSON(),
          };
          newBoardMembers.push(id);

          updatedBoardMembers[
            `whiteboards/${board_id}/board_members`
          ] = newBoardMembers;
          updatedBoardMembers[
            `whiteboards/${board_id}/view_logs/${id}/lastModified`
          ] = newMemberslastModified[id].lastModified;
        }
      });

      let sentStr = "sent";
      let sendingStr = "Sending";

      if (hasNew) {
        const ref = firebase.database().ref();
        await ref.update(updatedBoardMembers, () => {
          setBoardMembers(newBoardMembers);
          setMemberslastModified(newMemberslastModified);
        });

        const addEmailToAddressBookFunc = getCallableFbFunction(
          "users-addEmailToAddressBook"
        );
        const params = {
          emails,
        };

        try {
          await addEmailToAddressBookFunc(params);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.log(e);

          enqueueSnackbar(e.toString(), {
            variant: "error",
          });
        }
      } else {
        sentStr = "re-sent";
        sendingStr = "Re-sending";
      }

      const mapper = async (email) => {
        let infoKey;

        try {
          infoKey = enqueueSnackbar(`${sendingStr} invitation to ${email}...`, {
            variant: "info",
            persist: true,
          });

          const func = getCallableFbFunction("boards-resendInvitation");
          const params = {
            email,
            board_id,
            subject,
          };

          await func(params);

          closeSnackbar(infoKey);
          enqueueSnackbar(
            `The invitation to ${email} has been successfully ${sentStr}`,
            {
              variant: "success",
            }
          );
        } catch (e) {
          // eslint-disable-next-line no-console
          console.log(e);

          if (infoKey) {
            closeSnackbar(infoKey);
          }

          enqueueSnackbar(e.toString(), {
            variant: "error",
          });
        }
      };

      await pMap(emails, mapper, {
        concurrency: 5,
      });
    } finally {
      addWorking(workId, false);
    }
  };

  const resendInvitation = async (email, workId) => {
    try {
      await addMember(email, formVals.subject, workId);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);

      enqueueSnackbar(e.toString(), {
        variant: "error",
      });
    }
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    try {
      if (formVals.email.includes(" ")) {
        throw new Error(`Please seperate email(s) with a comma (,)`);
      }

      await addMember(formVals.email, formVals.subject, "invite-form");

      setFormVals((prevFormVals) => ({ ...prevFormVals, email: [] }));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);

      enqueueSnackbar(e.toString(), {
        variant: "error",
      });
    }
  };

  const formProps = {
    ...formPropsInput,
    id: `board-${board_id}-invite-form`,
    onSubmit: handleFormSubmit,
  };

  const handleInputChange = (event) => {
    const { name } = event.target;
    const { value } = event.target;

    setFormVals((prevFormVals) => ({
      ...prevFormVals,
      [name]: value,
    }));
  };

  const handleEmailChange = (event, newValue) => {
    setFormVals((prevFormVals) => ({ ...prevFormVals, email: newValue }));
  };

  const excludeEmails = React.useMemo(
    () => boardMembers.map((memberId) => idToEmail(memberId)),
    [boardMembers]
  );

  const handleChangeTrackReport = async (evt) => {
    evt.persist();
    setShouldTrackReport(evt.target.checked);
    const shouldTrackVisitsRef = firebase
      .database()
      .ref(`whiteboards/${board_id}/shouldTrackVisits`);

    try {
      setSubmitting(true);
      await shouldTrackVisitsRef.transaction(() => evt.target.checked);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err);

      enqueueSnackbar(err.toString(), {
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const submitButton = (
    <Button
      className="confirm-button"
      form={formProps.id}
      disabled={submitting}
      type="submit"
    >
      Invite
    </Button>
  );

  return (
    <>
      <div className="boardInviter-header">
        <div className="boardInviter-header-row">
          <strong className="header-text">Collaborators:</strong>
          <strong className="header-text">Last Modified:</strong>
        </div>
        {boardMembers.map((member, index) => {
          const email = idToEmail(member);
          const isMe = email === user.email;
          const isOwner = index === 0;
          let button;

          let lastModifiedConverted = "-";
          if (memberslastModified && memberslastModified[member]) {
            const lastModified = Dayjs(
              memberslastModified[member].lastModified
            );

            if (lastModified.isValid()) {
              lastModifiedConverted = lastModified.format(
                "YYYY-MM-DD HH:mm(UTC)"
              );
            }
          }

          if (isOwner) {
            button = (
              <IconButton edge="end" disabled size="small">
                Owner
              </IconButton>
            );
          } else {
            const menuId = `board-collab-menu-${index}`;
            button = (
              <PopupState variant="popover" popupId={menuId}>
                {(popupState) => (
                  <>
                    <IconButton edge="end" {...bindTrigger(popupState)}>
                      <ExpandMoreIcon />
                    </IconButton>
                    <Menu keepMounted {...bindMenu(popupState)}>
                      <MenuItem
                        disabled={isMe || working[`${menuId}-invite`]}
                        onClick={() => {
                          popupState.close();
                          resendInvitation(email, `${menuId}-invite`);
                        }}
                      >
                        <ListItemIcon>
                          <SendIcon />
                        </ListItemIcon>
                        <ListItemText primary="Re-send Invitation" />
                      </MenuItem>
                      <MenuItem
                        disabled={working[`${menuId}-remove`]}
                        onClick={() => {
                          popupState.close();
                          removeMember(email, `${menuId}-remove`);
                        }}
                      >
                        <ListItemIcon>
                          <RemoveCircleOutlineIcon />
                        </ListItemIcon>
                        <ListItemText primary="Remove Board Member" />
                      </MenuItem>
                    </Menu>
                  </>
                )}
              </PopupState>
            );
          }
          return (
            <div className="boardInviter-header-row" key={createUUID()}>
              <div className="list-item">
                <span>
                  {email} {isMe && " (you)"}
                </span>
                {button}
              </div>
              <div className="list-item">{lastModifiedConverted}</div>
            </div>
          );
        })}
      </div>
      <Form {...formProps}>
        <Form.Group controlId={`${formProps.id}-email`}>
          <AddressAutoComplete
            excludeEmails={excludeEmails}
            value={formVals.email}
            onChange={handleEmailChange}
          />
        </Form.Group>
        <Form.Group controlId={`${formProps.id}-subject`}>
          <TextField
            className="invite-form"
            label="Subject Line"
            autoComplete="off"
            name="subject"
            value={formVals.subject}
            onChange={handleInputChange}
          />
          <Form.Text className="text-muted">
            The subject line of the invitation email
          </Form.Text>
        </Form.Group>
        <FormControlLabel
          control={
            <Checkbox
              checked={shouldTrackReport}
              onChange={handleChangeTrackReport}
            />
          }
          label={
            <div className="track-check-label">
              Track visits to this board
              <Tooltip title="You will receive one email per day of a digest of boards viewed">
                <HelpOutlineOutlinedIcon />
              </Tooltip>
            </div>
          }
        />
        {portalContainer && (
          <Portal container={portalContainer}>{submitButton}</Portal>
        )}
        {!portalContainer && (
          <Form.Group className="text-right">{submitButton}</Form.Group>
        )}
      </Form>
    </>
  );
};

export default InviteForm;
