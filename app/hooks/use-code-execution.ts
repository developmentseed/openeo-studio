import { useCallback, useState } from 'react';
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
  const [isExecuting, setIsExecuting] = useState(false);

  const executeCode = useCallback(async () => {
    if (!pyodide || !editor) return;

    setIsExecuting(true);
    try {
      const content = editor.state.doc.toString();
      const url = await processScript(
        pyodide,
        user?.access_token ?? '',
        content,
        config
      );
      setTileUrl(url);
    } finally {
      setIsExecuting(false);
    }
  }, [pyodide, user?.access_token, editor, setTileUrl, config]);

  return {
    executeCode,
    isExecuting,
    isReady: isAuthenticated && !!pyodide && !!editor
  };
}
