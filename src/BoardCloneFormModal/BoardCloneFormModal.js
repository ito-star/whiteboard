/* eslint-disable react/require-default-props */
import React, { useState } from "react";
import PropTypes from "prop-types";
import Modal from "react-bootstrap/Modal";
import { useModal } from "mui-modal-provider";
import RateLimitErrorModal from "../Board/RateLimitErrorModal";
import BoardCloneForm from "../BoardCloneForm";

const BoardCloneFormModal = (props) => {
  const [isSubmitting, setSubmitting] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);
  const { board_id, formProps: formPropsInput = {}, modalProps } = props;
  const { showModal } = useModal();

  const hideModal = () => {
    if (props.modalProps.onHide) {
      props.modalProps.onHide();
    }
  };

  const onSuccess = (data) => {
    if (props.onSuccess) {
      props.onSuccess(data);
    }

    hideModal();
  };

  const onError = (err) => {
    if (props.onError) {
      props.onError(err);
    }

    showModal(RateLimitErrorModal, { isDashboard: true });

    hideModal();
  };

  const onSubmitting = (isSubmitting_) => {
    if (props.onSubmitting && isSubmitting_) {
      props.onSubmitting(isSubmitting_);
    }

    setSubmitting(isSubmitting_);
  };

  const onSubmitAccessChange = (canSubmit_) => {
    if (props.onSubmitAccessChange) {
      props.onSubmitAccessChange(canSubmit_);
    }

    setCanSubmit(canSubmit_);
  };

  const formProps = {
    id: `clone-board-form-${board_id}`,
    ...formPropsInput,
  };

  return (
    <Modal {...modalProps} onHide={hideModal}>
      <Modal.Header>
        <Modal.Title>Clone Board</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <BoardCloneForm
          board_id={board_id}
          formProps={formProps}
          onSuccess={onSuccess}
          onSubmitting={onSubmitting}
          onError={onError}
          onSubmitAccessChange={onSubmitAccessChange}
        />
      </Modal.Body>
      <Modal.Footer>
        <button
          type="button"
          className="neutral-button"
          onClick={hideModal}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          form={formProps.id}
          className="confirm-button"
          disabled={isSubmitting || !canSubmit}
        >
          Clone
        </button>
      </Modal.Footer>
    </Modal>
  );
};

BoardCloneFormModal.propTypes = {
  ...BoardCloneForm.propTypes,
  modalProps: PropTypes.shape(Modal.propTypes),
};

export default BoardCloneFormModal;
