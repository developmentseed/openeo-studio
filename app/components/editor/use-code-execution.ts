import { useCallback, useState } from 'react';
import { useAuth } from 'react-oidc-context';
import type { EditorView } from '@codemirror/view';

import { usePyodide } from '$contexts/pyodide-context';
import { processScript } from '$utils/code-runner';
import type { ExecutionConfig, ServiceInfo } from '$types';

export function useCodeExecution(
  setServices: (services: ServiceInfo[]) => void,
  editor: EditorView | null,
  config: ExecutionConfig
) {
  const { pyodide } = usePyodide();
  const { user } = useAuth();
  const [isExecuting, setIsExecuting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const executeCode = useCallback(async () => {
    if (!pyodide || !editor) return;

    setIsExecuting(true);
    setErrorMessage(null);
    try {
      const content = editor.state.doc.toString();
      const services = await processScript(
        pyodide,
        user?.access_token ?? '',
        content,
        config
      );
      if (services) {
        setServices(services);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown execution error.';
      setErrorMessage(message);
    } finally {
      setIsExecuting(false);
    }
  }, [pyodide, user?.access_token, editor, setServices, config]);

  return {
    executeCode,
    isExecuting,
    isReady: !!pyodide && !!editor,
    errorMessage
  };
}
