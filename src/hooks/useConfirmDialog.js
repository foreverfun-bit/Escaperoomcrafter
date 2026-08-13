import { useCallback, useState } from 'react';

// Pairs with <ConfirmDialog>: spread `dialogProps` onto it, and call
// requestConfirm({ title, message, confirmLabel, danger, onConfirm }) instead
// of window.confirm(...) to gate a destructive action.
export function useConfirmDialog() {
  const [state, setState] = useState(null);

  const requestConfirm = useCallback((opts) => setState(opts), []);
  const cancel = useCallback(() => setState(null), []);
  const confirm = useCallback(() => {
    state?.onConfirm();
    setState(null);
  }, [state]);

  return {
    requestConfirm,
    dialogProps: {
      open: Boolean(state),
      title: state?.title,
      message: state?.message,
      confirmLabel: state?.confirmLabel,
      danger: state?.danger,
      onConfirm: confirm,
      onCancel: cancel,
    },
  };
}
