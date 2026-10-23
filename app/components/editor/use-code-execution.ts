import { useCallback, useState } from 'react';
import { useAuth } from 'react-oidc-context';
import { kebabCase } from 'lodash-es';
import type { EditorView } from '@codemirror/view';

import { usePyodide } from '$stores/pyodide-store';
import {
  createServicesFromGraphs,
  runAndValidateScript
} from '$utils/code-runner';
import {
  mergeProcessGraphs,
  resolveSharedParameters
} from '$utils/openeo/user-defined-processes';
import { shouldNavigateAfterSave } from '$config/sample-scenes';
import type { ExecutionConfig, GraphResult, ServiceInfo } from '$types';
import { useEditorStore } from '$stores/editor-store';
import { useProjectsStore } from '$stores/projects-store';

type RunResult = {
  content: string;
  graphs: GraphResult[];
  services: ServiceInfo[];
};

export type SaveProjectResult =
  | { status: 'saved'; id: string }
  | { status: 'no-graph' }
  | { status: 'error' };

export function useCodeExecution(
  setServices: (services: ServiceInfo[]) => void,
  editor: EditorView | null,
  config: ExecutionConfig
) {
  const { pyodide } = usePyodide();
  const { user } = useAuth();

  const { sceneId, sceneName, markClean, setLastRun } = useEditorStore();
  const saveProject = useProjectsStore((state) => state.saveProject);

  const [isExecuting, setIsExecuting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const runAndCreateServices = useCallback(async (): Promise<RunResult> => {
    if (!pyodide || !editor) {
      throw new Error('Editor is not ready.');
    }

    const content = editor.state.doc.toString();
    const token = user?.access_token ?? '';
    let graphs: GraphResult[] = [];
    // Which step failed tells the assistant where to look: the code, the
    // graph it built, or the map services built from a valid graph.
    let step = 'Running the code';
    try {
      await runAndValidateScript(
        pyodide,
        token,
        content,
        config,
        (produced) => {
          graphs = produced;
          step = 'Validating the graph with the backend';
        }
      );
      step = 'Creating the map services (the backend validated the graph)';
      const services = await createServicesFromGraphs(graphs, token);
      setLastRun({ graphs, error: null });
      setServices(services);
      return { content, graphs, services };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setLastRun({ graphs, error: `${step} failed: ${message}` });
      throw error;
    }
  }, [pyodide, editor, user?.access_token, config, setServices, setLastRun]);

  /** Auto-execute: run code and create map services. Never persists. */
  const createServices = useCallback(async () => {
    if (!pyodide || !editor) return;

    setIsExecuting(true);
    setErrorMessage(null);
    try {
      await runAndCreateServices();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown execution error.';
      setErrorMessage(message);
    } finally {
      setIsExecuting(false);
    }
  }, [pyodide, editor, runAndCreateServices]);

  /** Save button: run, create services, then persist the project. */
  const saveProjectAndServices =
    useCallback(async (): Promise<SaveProjectResult> => {
      if (!pyodide || !editor) return { status: 'error' };

      setIsExecuting(true);
      setErrorMessage(null);
      try {
        const { content, graphs, services } = await runAndCreateServices();

        if (services.length === 0) {
          return { status: 'no-graph' };
        }

        const id =
          !shouldNavigateAfterSave(sceneId) && sceneId
            ? sceneId
            : kebabCase(sceneName);
        try {
          await saveProject(user?.access_token ?? '', {
            id,
            summary: sceneName,
            code: content,
            processGraph: mergeProcessGraphs(
              graphs.map((graph) => graph.process_graph)
            ),
            parameters: resolveSharedParameters(
              graphs.map((graph) => graph.parameters)
            )
          });
        } catch (error) {
          // The code ran and the map rendered; only storing the project failed.
          const message =
            error instanceof Error ? error.message : String(error);
          setLastRun({
            graphs,
            error: `Saving the project as "${id}" failed (the code ran and the map rendered): ${message}`
          });
          throw error;
        }

        markClean();
        return { status: 'saved', id };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown execution error.';
        setErrorMessage(message);
        return { status: 'error' };
      } finally {
        setIsExecuting(false);
      }
    }, [
      pyodide,
      editor,
      runAndCreateServices,
      markClean,
      sceneId,
      sceneName,
      saveProject,
      setLastRun,
      user?.access_token
    ]);

  return {
    createServices,
    saveProjectAndServices,
    isExecuting,
    isReady: !!pyodide && !!editor,
    errorMessage
  };
}
