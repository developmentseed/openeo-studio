import { useCallback } from 'react';
import { useAuth } from 'react-oidc-context';
import type { EditorView } from '@codemirror/view';

import { usePyodide } from '$contexts/pyodide-context';
import { processScript } from '$utils/code-runner';
import type { ExecutionConfig } from '$utils/template-renderer';

export function useCodeExecution(
  setTileUrl: (url: string | undefined) => void,
  editor: EditorView | null,
  config: ExecutionConfig
) {
  const { pyodide } = usePyodide();
  const { user, isAuthenticated } = useAuth();

  const executeCode = useCallback(async () => {
    if (!pyodide || !editor) return;

    const content = editor.state.doc.toString();
    const url = await processScript(
      pyodide,
      user?.access_token ?? '',
      content,
      config
    );
    setTileUrl(url);
  }, [pyodide, user?.access_token, editor, setTileUrl, config]);

  return {
    executeCode,
    isExecuting: false, // TODO: Add execution state tracking
    isReady: isAuthenticated && !!pyodide && !!editor
  };
}
