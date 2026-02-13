import { useMemo, useEffect } from 'react';
import { Flex, Splitter } from '@chakra-ui/react';
import { useCollection } from '@developmentseed/stac-react';
import { useParams, useNavigate } from 'react-router';
import { useAuth } from 'react-oidc-context';
import { StacCollection } from 'stac-ts';
import { useShallow } from 'zustand/shallow';

import { EditorHeader } from '$components/layout/editor-header';
import { EditorPanel } from '$components/layout/editor-panel';
import { MapPanel } from '$components/layout/map-panel';
import { extractBandsFromStac } from '$utils/stac-band-parser';
import { getSceneById } from '$config/sample-scenes';
import { useEditorStore } from '$stores/editor-store';

export function EditorPage() {
  const { sceneId } = useParams<{ sceneId: string }>();
  const navigate = useNavigate();
  const { isLoading, isAuthenticated } = useAuth();

  const scene = getSceneById(sceneId!);
  const isBlankScene = !sceneId;
  const { storedSceneId, collectionId, temporalRange } = useEditorStore(
    useShallow((state) => ({
      storedSceneId: state.sceneId,
      collectionId: state.collectionId,
      temporalRange: state.temporalRange
    }))
  );

  // Actions don't cause re-renders
  const { setSceneId, resetToDefaults, hydrateFromScene, setTemporalRange } =
    useEditorStore();

  // Sync store with route changes (scene switches)
  useEffect(() => {
    if (isBlankScene) {
      if (storedSceneId !== null) {
        resetToDefaults({
          collectionId: 'sentinel-2-l2a',
          cloudCover: 50,
          temporalRange: ['', ''],
          selectedBands: [],
          boundingBox: undefined
        });
        setSceneId(null);
      }
      return;
    }

    if (!scene) return;

    // Only hydrate when switching to a different scene
    if (storedSceneId !== sceneId) {
      hydrateFromScene(sceneId!, {
        collectionId: scene.collectionId,
        temporalRange: scene.temporalRange,
        cloudCover: scene.cloudCover ?? 100,
        defaultBands: scene.defaultBands ?? [],
        boundingBox: scene.boundingBox,
        suggestedAlgorithm: scene.suggestedAlgorithm
      });
    }
  }, [
    sceneId,
    isBlankScene,
    scene,
    storedSceneId,
    hydrateFromScene,
    resetToDefaults,
    setSceneId
  ]);

  const { collection: collectionRaw } = useCollection(collectionId);
  const collection = collectionRaw as unknown as StacCollection | null;

  // For blank scenes, set temporal range from collection extent when available
  useEffect(() => {
    if (isBlankScene && collection?.extent?.temporal?.interval) {
      const intervals = collection.extent.temporal.interval;
      if (intervals.length > 0 && intervals[0].length >= 2) {
        const [start, end] = intervals[0];

        if (start) {
          const startDate = new Date(start);
          const endDate = end ? new Date(end) : new Date();

          if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
            const startDateStr = startDate.toISOString().split('T')[0];
            const endDateStr = endDate.toISOString().split('T')[0];
            setTemporalRange([startDateStr, endDateStr]);
          }
        }
      }
    }
  }, [isBlankScene, collection, temporalRange, setTemporalRange]);

  // Extract band metadata from STAC item
  const bands = useMemo(() => extractBandsFromStac(collection), [collection]);

  // Early return
  if (isLoading) {
    return null; // Still loading auth state
  }

  if (!scene && !isBlankScene) {
    // Scene not found and not blank scene - navigate back
    navigate('/', { replace: true });
    return null;
  }

  return (
    <Flex flexDirection='column' flex={1} minHeight={0}>
      <EditorHeader sceneName={isBlankScene ? '...' : scene!.name} />

      {/* Editor and Map panels */}
      <Splitter.Root
        defaultSize={[50, 50]}
        panels={[
          { id: 'editor', minSize: 20 },
          { id: 'map', minSize: 20 }
        ]}
      >
        <Splitter.Panel id='editor'>
          <EditorPanel
            availableBands={bands}
            initialCode={scene?.suggestedAlgorithm || ''}
            defaultTab={isBlankScene ? 'configuration' : 'code'}
            autoExecuteOnReady={
              isAuthenticated &&
              !isBlankScene &&
              !!scene?.suggestedAlgorithm?.trim()
            } // Auto-execute only if user is logged in AND this is a sample scene AND it has a non-empty suggested algorithm.
          />
        </Splitter.Panel>

        <Splitter.ResizeTrigger id='editor:map' />

        <Splitter.Panel id='map'>
          <MapPanel />
        </Splitter.Panel>
      </Splitter.Root>
    </Flex>
  );
}
