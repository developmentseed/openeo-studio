import { useCallback, useState } from 'react';
import { useAuth } from 'react-oidc-context';
import { useNavigate } from 'react-router';
import { kebabCase } from 'lodash-es';
import type { EditorView } from '@codemirror/view';

import { usePyodide } from '$contexts/pyodide-context';
import { processScript } from '$utils/code-runner';
import {
  mergeProcessGraphs,
  resolveSharedParameters
} from '$utils/process-graphs';
import type { ExecutionConfig, ServiceInfo } from '$types';
import { useEditorStore } from '$stores/editor-store';
import { useProjectsStore } from '$stores/projects-store';

export function useCodeExecution(
  setServices: (services: ServiceInfo[]) => void,
  editor: EditorView | null,
  config: ExecutionConfig
) {
  const { pyodide } = usePyodide();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { hasCodeChanged, setHasCodeChanged, sceneName, sceneId, setSceneId } =
    useEditorStore();
  const saveProject = useProjectsStore((state) => state.saveProject);

  const [isExecuting, setIsExecuting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const executeCode = useCallback(async () => {
    if (!pyodide || !editor) return;

    setIsExecuting(true);
    setErrorMessage(null);
    setHasCodeChanged(false);
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

      // Save (or update) the project as a UDP once execution succeeds.
      // Every add_graph_to_map() call produces its own GraphResult (all of
      // them still become ephemeral /services for map preview); all of them
      // get combined into one process graph here so none are dropped.
      if (services && services.length > 0) {
        const id = kebabCase(sceneName);
        const processGraph = mergeProcessGraphs(
          services.map((service) => service.graphResult.process_graph)
        );
        const parameters = resolveSharedParameters(
          services.map((service) => service.graphResult.parameters)
        );

        await saveProject(user?.access_token ?? '', {
          id,
          summary: sceneName,
          code: content,
          processGraph,
          parameters
        });

        // First save of a blank scene: reflect the new project in the URL.
        if (!sceneId) {
          setSceneId(id);
          navigate(`/editor/${id}`, { replace: true });
        }
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown execution error.';
      setErrorMessage(message);
    } finally {
      setIsExecuting(false);
    }
  }, [
    pyodide,
    user?.access_token,
    editor,
    setServices,
    config,
    setHasCodeChanged,
    sceneName,
    sceneId,
    setSceneId,
    saveProject,
    navigate
  ]);

  return {
    executeCode,
    isExecuting,
    isReady: !!pyodide && !!editor,
    errorMessage,
    hasCodeChanged
  };
}
