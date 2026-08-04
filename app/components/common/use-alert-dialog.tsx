import { useCallback, useRef, useState } from 'react';
import { Button } from '@chakra-ui/react';

import { ActionDialog } from './action-dialog';

export type AlertDialogOptions = {
  title: string;
  body: React.ReactNode;
  okLabel?: string;
};

type AlertState = AlertDialogOptions & {
  open: boolean;
  resolve: () => void;
};

/**
 * Imperative alert dialog: `alert()` returns a promise that resolves when the
 * user dismisses it (ok button, close trigger, or backdrop).
 * Stays mounted until the exit animation completes.
 */
export function useAlertDialog() {
  const [state, setState] = useState<AlertState | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const settledRef = useRef(false);

  const settle = useCallback(() => {
    const current = stateRef.current;
    if (!current || settledRef.current) return;
    settledRef.current = true;
    current.resolve();
    setState({ ...current, open: false });
  }, []);

  const alert = useCallback((options: AlertDialogOptions) => {
    return new Promise<void>((resolve) => {
      settledRef.current = false;
      setState({ ...options, open: true, resolve });
    });
  }, []);

  const dialog = state ? (
    <ActionDialog
      open={state.open}
      title={state.title}
      onClose={settle}
      onExitComplete={() => setState(null)}
      actions={
        <Button variant='solid' size='sm' onClick={settle}>
          {state.okLabel ?? 'OK'}
        </Button>
      }
    >
      {state.body}
    </ActionDialog>
  ) : null;

  return { alert, dialog };
}
