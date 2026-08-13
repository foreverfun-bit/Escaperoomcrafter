import Modal from './Modal.jsx';
import Button from './Button.jsx';

// A themed replacement for window.confirm(): some hosting contexts (e.g. a
// sandboxed artifact iframe) silently suppress native confirm() dialogs,
// which makes every action gated behind one look like it "does nothing".
export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  danger = true,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-stone-400">{message}</p>
    </Modal>
  );
}
