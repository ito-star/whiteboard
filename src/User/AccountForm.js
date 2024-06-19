import React, { useState } from "react";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import Alert from "react-bootstrap/Alert";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import InputGroup from "react-bootstrap/InputGroup";
import DropdownButton from "react-bootstrap/DropdownButton";
import Dropdown from "react-bootstrap/Dropdown";
import _forEach from "lodash/forEach";
import _keyBy from "lodash/keyBy";

import useUser from "../auth/useUser";
import { isExternalProvider, AUTH_PROVIDER_NAMES } from "../auth/utils";
import UserAvatar from "./UserAvatar";

const AccountForm = (props) => {
  const {
    user,
    updateUserProfile,
    reauthenticate,
    updatePassword,
    sendEmailVerification,
  } = useUser();
  const { formProps: formPropsInput } = props;
  const [alerts, setAlerts] = useState({});
  const [working, setWorking] = useState({});
  const [formVals, setFormVals] = useState(() => {
    if (user) {
      return {
        displayName: user.displayName,
        photoURL: user.photoURL,
      };
    }

    return {};
  });

  /**
   * Add an alert to the dialog
   *
   * Parameters:
   *
   * id: A unique ID
   * props: Bootstrap Alert props. See https://react-bootstrap.github.io/components/alerts/
   * content: The alert content
   */
  const addAlert = (id, alertProps, content) => {
    setAlerts({
      ...alerts,
      [id]: {
        porps: alertProps,
        content,
      },
    });
  };

  const dismissAlert = (id) => {
    if (alerts[id]) {
      delete alerts[id];
      const newAlerts = {
        ...alerts,
      };
      setAlerts(newAlerts);
    }
  };

  const addWorking = (id, isWorking) => {
    setWorking({
      ...working,
      [id]: isWorking,
    });
  };

  const onSuccess = () => {
    if (props.onSuccess) {
      props.onSuccess();
    }
  };

  const notifySubmitting = (isSubmitting) => {
    if (props.notifySubmitting) {
      props.notifySubmitting(isSubmitting);
    }
  };

  let hasPassword = false;

  const saveModal = async (event) => {
    event.preventDefault();
    notifySubmitting(true);

    try {
      const newProfile = {
        displayName: formVals.displayName,
        photoURL: formVals.photoURL,
      };

      if (hasPassword) {
        const { newPassword } = formVals;

        if (newPassword) {
          const currentPassword = formVals.password;

          if (!currentPassword) {
            addAlert(
              "current-password-required",
              {
                variant: "danger",
              },
              "Changing your password requires that you enter your current one"
            );

            return;
          }

          const confirmNewPassword = formVals.newPasswordConfirm;

          if (newPassword !== confirmNewPassword) {
            addAlert(
              "passwords-must-match",
              {
                variant: "danger",
              },
              'The "New Password" field must match the "Confirm New Password Field"'
            );

            return;
          }

          const credential = firebase.auth.EmailAuthProvider.credential(
            user.email,
            currentPassword
          );

          await reauthenticate(
            firebase.auth.EmailAuthProvider.PROVIDER_ID,
            credential
          );
          await updatePassword(newPassword);
        }
      }

      await updateUserProfile(newProfile);

      onSuccess();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);

      addAlert(
        "form-error",
        {
          variant: "danger",
        },
        e.message
      );
    } finally {
      notifySubmitting(false);
    }
  };

  const sendValidationEmail = async () => {
    const workId = "send-validation-email";

    addAlert(
      workId,
      {
        variant: "primary",
      },
      `Re-sending validation email...`
    );

    addWorking(workId, true);

    try {
      await sendEmailVerification();

      addAlert(
        workId,
        {
          variant: "success",
        },
        `The validation email has been successfully re-sent`
      );
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);

      addAlert(
        workId,
        {
          variant: "danger",
        },
        e.message
      );
    } finally {
      addWorking(workId, false);
    }
  };

  const formProps = {
    ...formPropsInput,
    id: "user-account-edit-form",
    onSubmit: saveModal,
  };

  const handleInputChange = (event) => {
    const { target } = event;
    const { value } = target;
    const { name } = target;

    setFormVals({
      ...formVals,
      [name]: value,
    });
  };

  const renderedAlerts = [];

  _forEach(alerts, (alert, alertId) => {
    renderedAlerts.push(
      <Alert
        {...alert.props}
        key={alertId}
        dismissible
        onClose={() => {
          dismissAlert(alertId);
        }}
      >
        {alert.content}
      </Alert>
    );
  });

  if (user) {
    const providerMap = _keyBy(user.providerData, "providerId");
    hasPassword = !!providerMap[firebase.auth.EmailAuthProvider.PROVIDER_ID];
    const externalProviders = user.providerData
      .filter(isExternalProvider)
      .map((provider) => provider.providerId);

    const makeProviderLoaderButtons = (prop) => {
      const buttons = [];

      const onClick = (event) => {
        const providerId = event.target.value;
        const providerData = providerMap[providerId];

        setFormVals({
          ...formVals,
          [prop]: providerData[prop],
        });
      };

      _forEach(externalProviders, (providerId) => {
        buttons.push(
          <Dropdown.Item
            key={providerId}
            as="button"
            type="button"
            value={providerId}
            onClick={onClick}
          >
            {AUTH_PROVIDER_NAMES[providerId]}
          </Dropdown.Item>
        );
      });

      return buttons;
    };

    const profile = ["displayName", "photoURL"].reduce((acc, prop) => {
      const value = formVals[prop];

      acc[prop] = {
        value,
        loaderButtons: makeProviderLoaderButtons(prop),
      };

      return acc;
    }, {});

    const reloadProfileFromProvider = async (event) => {
      const providerId = event.target.value;

      await reauthenticate(providerId);
    };

    const reloadButtons = externalProviders.map((providerId) => {
      return (
        <Dropdown.Item
          key={providerId}
          as="button"
          type="button"
          value={providerId}
          onClick={reloadProfileFromProvider}
        >
          {AUTH_PROVIDER_NAMES[providerId]}
        </Dropdown.Item>
      );
    });

    return (
      <>
        {renderedAlerts}
        <Form {...formProps}>
          <Form.Group as={Row} controlId="formPlaintextEmail">
            <Form.Label column sm="2">
              Email
            </Form.Label>
            <Col sm="10">
              <Form.Control plaintext readOnly defaultValue={user.email} />
              {user.emailVerified && (
                <span className="text-success">Verified</span>
              )}
              {!user.emailVerified && (
                <span className="text-danger">
                  Not Verified &nbsp;&nbsp;
                  <button
                    type="button"
                    className="confirm-button"
                    disabled={working["send-validation-email"]}
                    onClick={sendValidationEmail}
                  >
                    Re-send validation email
                  </button>
                </span>
              )}
            </Col>
          </Form.Group>
          <fieldset>
            <legend>User Profile</legend>
            <Form.Group
              controlId={`${formProps.id}-display-name`}
              className="form-group-display-name"
            >
              <Form.Label>Display Name</Form.Label>
              <InputGroup>
                {Boolean(profile.displayName.loaderButtons.length) && (
                  <DropdownButton
                    as={InputGroup.Prepend}
                    variant="secondary"
                    title="Load data from"
                  >
                    {profile.displayName.loaderButtons}
                  </DropdownButton>
                )}
                <Form.Control
                  name="displayName"
                  type="text"
                  value={profile.displayName.value}
                  required
                  onChange={handleInputChange}
                />
              </InputGroup>
            </Form.Group>
            {Boolean(profile.photoURL.loaderButtons.length) && (
              <Form.Group
                controlId={`${formProps.id}-photo-url`}
                className="form-group-photo-url"
              >
                <Form.Label>Avatar</Form.Label>
                <div className="d-flex">
                  <DropdownButton
                    variant="secondary"
                    title="Load data from"
                    className="mr-3"
                  >
                    {profile.photoURL.loaderButtons}
                  </DropdownButton>
                  <input
                    name="photoURL"
                    type="hidden"
                    value={profile.photoURL.value}
                  />
                  <UserAvatar
                    user={{
                      displayName: profile.displayName.value,
                      photoURL: profile.photoURL.value,
                    }}
                  />
                </div>
              </Form.Group>
            )}
            {Boolean(reloadButtons.length) && (
              <DropdownButton
                variant="secondary"
                title="Reload data from"
                className="reload-buttons"
              >
                {reloadButtons}
              </DropdownButton>
            )}
          </fieldset>
          {hasPassword && (
            <fieldset>
              <legend>Change Password</legend>
              <Form.Group controlId={`${formProps.id}-password`}>
                <Form.Label>Current Password</Form.Label>
                <Form.Control
                  name="password"
                  type="password"
                  onChange={handleInputChange}
                />
              </Form.Group>
              <Form.Group controlId={`${formProps.id}-new-password`}>
                <Form.Label>New Password</Form.Label>
                <Form.Control
                  name="newPassword"
                  type="password"
                  onChange={handleInputChange}
                />
              </Form.Group>
              <Form.Group controlId={`${formProps.id}-new-password-confirm`}>
                <Form.Label>Confirm New Password</Form.Label>
                <Form.Control
                  name="newPasswordConfirm"
                  type="password"
                  onChange={handleInputChange}
                />
              </Form.Group>
            </fieldset>
          )}
        </Form>
      </>
    );
  }

  return null;
};

AccountForm.defaultProps = {
  formProps: {},
  onSuccess: () => {},
  notifySubmitting: () => {},
};

const ModalAccountForm = (props) => {
  const [isSubmitting, setSubmitting] = useState(false);
  const { formProps, modalProps } = props;
  const hideModal = () => {
    if (props.modalProps.onHide) {
      props.modalProps.onHide();
    }
  };
  const onSuccess = () => {
    if (props.onSuccess) {
      props.onSuccess();
    }

    hideModal();
  };
  const notifySubmitting = (submitting) => {
    if (props.notifySubmitting) {
      props.notifySubmitting(submitting);
    }

    setSubmitting(submitting);
  };

  return (
    <Modal {...modalProps} size="lg" onHide={hideModal}>
      <Modal.Header>
        <Modal.Title>Edit Account Information</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <AccountForm
          formProps={formProps}
          onSuccess={onSuccess}
          notifySubmitting={notifySubmitting}
        />
      </Modal.Body>
      <Modal.Footer>
        <button
          type="button"
          className="neutral-button"
          onClick={hideModal}
          disabled={isSubmitting}
        >
          Close
        </button>
        <button
          type="submit"
          form="user-account-edit-form"
          className="confirm-button"
          disabled={isSubmitting}
        >
          Save
        </button>
      </Modal.Footer>
    </Modal>
  );
};

ModalAccountForm.defaultProps = {
  formProps: {},
  modalProps: {},
  onSuccess: () => {},
  notifySubmitting: () => {},
};

export default ModalAccountForm;
