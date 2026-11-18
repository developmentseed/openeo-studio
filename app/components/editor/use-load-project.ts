import { type ReactNode, useEffect, useState } from 'react';
import { useAuth } from 'react-oidc-context';
import { useNavigate } from 'react-router';

import { useReplaceEditorContents } from '$components/catalogue/use-open-entry';

import { catalogue } from '$config/catalogue';
import { useEditorStore } from '$stores/editor-store';

interface UseLoadProjectResult {
  isLoading: boolean;
  error: unknown;
  dialog: ReactNode;
}

/**
 * Loads the saved project named by the /editor/:projectId route into the
 * editor store, unless it is already the active project. Unsaved work is
 * only replaced after the user confirms; on cancel the URL goes back to the
 * content the editor still holds. Assumes the caller
 * is authenticated (EditorPage is only reachable behind RequireAuth).
 */
export function useLoadProject(
  projectId: string | undefined
): UseLoadProjectResult {
  const { user } = useAuth();
  const storedSceneId = useEditorStore((state) => state.sceneId);
  const hydrateFromScene = useEditorStore((state) => state.hydrateFromScene);
  const navigate = useNavigate();
  const { replaceEditorContents, dialog } = useReplaceEditorContents();

  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const needsLoad = !!projectId && storedSceneId !== projectId;

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!needsLoad) {
        setError(null);
        return;
      }

      setIsFetching(true);
      setError(null);

      try {
        const { seed, autoRun } = await catalogue.load(
          { loader: 'saved-project', ref: projectId! },
          { authToken: user?.access_token }
        );

        if (cancelled) return;
        const replaced = await replaceEditorContents(() =>
          hydrateFromScene(projectId!, seed, autoRun)
        );

        if (!replaced && !cancelled) {
          const { sceneId } = useEditorStore.getState();
          navigate(sceneId ? `/editor/${sceneId}` : '/editor', {
            replace: true
          });
        }
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setIsFetching(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [
    needsLoad,
    user?.access_token,
    projectId,
    hydrateFromScene,
    replaceEditorContents,
    navigate
  ]);

  return {
    isLoading: needsLoad && isFetching,
    error: needsLoad ? error : null,
    dialog
  };
}
