import { useEffect, useState } from 'react';
import { useAuth } from 'react-oidc-context';

import { DEFAULT_EDITOR_CONFIG } from '$config/default-editor-config';
import { useEditorStore } from '$stores/editor-store';
import { useProjectsStore } from '$stores/projects-store';
import {
  deriveConfigFromProject,
  extractCodeFromDescription
} from '$utils/process-graphs';
import type { SampleScene } from '$types';

interface UseLoadProjectResult {
  isLoading: boolean;
  notFound: boolean;
}

/**
 * Loads a saved project into the editor store when the route points at an
 * id that isn't a static sample scene and isn't already the active project.
 * No-ops for blank scenes, static samples (EditorPage's existing effect
 * handles those), and ids that are already hydrated. Assumes the caller is
 * authenticated (EditorPage is only reachable behind RequireAuth).
 */
export function useLoadProject(
  sceneId: string | undefined,
  scene: SampleScene | undefined,
  isBlankScene: boolean
): UseLoadProjectResult {
  const { user } = useAuth();
  const storedSceneId = useEditorStore((state) => state.sceneId);
  const hydrateFromScene = useEditorStore((state) => state.hydrateFromScene);
  const loadProject = useProjectsStore((state) => state.loadProject);

  const [isFetching, setIsFetching] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const needsLoad = !isBlankScene && !scene && storedSceneId !== sceneId;

  useEffect(() => {
    if (!needsLoad) {
      setNotFound(false);
      return;
    }

    let cancelled = false;
    setIsFetching(true);
    setNotFound(false);

    loadProject(user?.access_token ?? '', sceneId!)
      .then((project) => {
        if (cancelled) return;
        const derived = deriveConfigFromProject(project);
        hydrateFromScene(project.id, {
          name: project.summary ?? project.id,
          collectionId:
            derived.collectionId ?? DEFAULT_EDITOR_CONFIG.collectionId,
          temporalRange:
            derived.temporalRange ?? DEFAULT_EDITOR_CONFIG.temporalRange,
          cloudCover: derived.cloudCover ?? DEFAULT_EDITOR_CONFIG.cloudCover,
          defaultBands:
            derived.selectedBands ?? DEFAULT_EDITOR_CONFIG.selectedBands,
          boundingBox: derived.boundingBox,
          suggestedAlgorithm:
            extractCodeFromDescription(project.description) ?? ''
        });
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setIsFetching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [needsLoad, user?.access_token, sceneId, loadProject, hydrateFromScene]);

  return {
    isLoading: needsLoad && isFetching,
    notFound: needsLoad && notFound
  };
}
