import { useEffect, useState } from 'react';
import { useAuth } from 'react-oidc-context';

import { useEditorStore } from '$stores/editor-store';
import { useProjectsStore } from '$stores/projects-store';
import {
  deriveConfigFromProject,
  extractCodeFromDescription
} from '$utils/process-graphs';
import type { SampleScene } from '$types';

const FALLBACK_CONFIG = {
  collectionId: 'sentinel-2-l2a',
  temporalRange: ['', ''] as [string, string],
  cloudCover: 50,
  selectedBands: [] as string[]
};

interface UseLoadProjectResult {
  isLoading: boolean;
  notFound: boolean;
  authRequired: boolean;
}

/**
 * Loads a saved project into the editor store when the route points at an
 * id that isn't a static sample scene and isn't already the active project.
 * No-ops for blank scenes, static samples (EditorPage's existing effect
 * handles those), and ids that are already hydrated.
 */
export function useLoadProject(
  sceneId: string | undefined,
  scene: SampleScene | undefined,
  isBlankScene: boolean
): UseLoadProjectResult {
  const { isLoading: isAuthLoading, isAuthenticated, user } = useAuth();
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
    if (isAuthLoading || !isAuthenticated) {
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
          collectionId: derived.collectionId ?? FALLBACK_CONFIG.collectionId,
          temporalRange: derived.temporalRange ?? FALLBACK_CONFIG.temporalRange,
          cloudCover: derived.cloudCover ?? FALLBACK_CONFIG.cloudCover,
          defaultBands: derived.selectedBands ?? FALLBACK_CONFIG.selectedBands,
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
  }, [
    needsLoad,
    isAuthLoading,
    isAuthenticated,
    user?.access_token,
    sceneId,
    loadProject,
    hydrateFromScene
  ]);

  return {
    isLoading: needsLoad && (isAuthLoading || isFetching),
    notFound: needsLoad && notFound,
    authRequired: needsLoad && !isAuthLoading && !isAuthenticated
  };
}
