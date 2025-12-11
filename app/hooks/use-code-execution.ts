import { useCallback } from 'react';
import { useAuth } from 'react-oidc-context';
import { usePyodide, processScript } from '$utils/code-runner';
import type { EditorView } from '@codemirror/view';

export function useCodeExecution(
  setTileUrl: (url: string | undefined) => void,
  editor: EditorView | null
) {
  const { pyodide } = usePyodide();
  const { user, isAuthenticated } = useAuth();

  const executeCode = useCallback(async () => {
    if (!pyodide || !editor) return;

    const content = editor.state.doc.toString();
    const url = await processScript(pyodide, user?.access_token ?? '', content);
    setTileUrl(url);
  }, [pyodide, user?.access_token, editor, setTileUrl]);

  return {
    executeCode,
    isExecuting: false, // TODO: Add execution state tracking
    isReady: isAuthenticated && !!pyodide && !!editor
  };
}
