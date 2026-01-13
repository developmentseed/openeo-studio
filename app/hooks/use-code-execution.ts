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

  const executeCode = useCallback(async () => {
    if (!pyodide || !editor) return;

    setIsExecuting(true);
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
    } finally {
      setIsExecuting(false);
    }
  }, [pyodide, user?.access_token, editor, setServices, config]);

  return {
    executeCode,
    isExecuting,
    isReady: !!pyodide && !!editor
  };
}
