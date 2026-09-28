import { useCallback, useRef, useState } from 'react';
import { Button } from '@chakra-ui/react';

import { ActionDialog } from './action-dialog';

export type ConfirmDialogOptions = {
  title: string;
  body: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
};

type ConfirmState = ConfirmDialogOptions & {
  open: boolean;
  resolve: (confirmed: boolean) => void;
};

/**
 * Imperative confirmation dialog: `confirm()` returns a promise that resolves
 * when the user chooses confirm (true) or cancel/dismiss (false).
 * Stays mounted until the exit animation completes.
 */
export function useConfirmDialog() {
  const [state, setState] = useState<ConfirmState | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const settledRef = useRef(false);

  const settle = useCallback((confirmed: boolean) => {
    const current = stateRef.current;
    if (!current || settledRef.current) return;
    settledRef.current = true;
    current.resolve(confirmed);
    setState({ ...current, open: false });
  }, []);

  const confirm = useCallback((options: ConfirmDialogOptions) => {
    return new Promise<boolean>((resolve) => {
      settledRef.current = false;
      setState({ ...options, open: true, resolve });
    });
  }, []);

  const dialog = state ? (
    <ActionDialog
      open={state.open}
      title={state.title}
      onClose={() => settle(false)}
      onExitComplete={() => setState(null)}
      actions={
        <>
          <Button variant='outline' size='sm' onClick={() => settle(false)}>
            {state.cancelLabel ?? 'Cancel'}
          </Button>
          <Button size='sm' onClick={() => settle(true)}>
            {state.confirmLabel ?? 'Confirm'}
          </Button>
        </>
      }
    >
      {state.body}
    </ActionDialog>
  ) : null;

  return { confirm, dialog };
}
