import { useEffect } from 'react';
import { Flex, Spinner, Splitter } from '@chakra-ui/react';
import { useCollection } from '@developmentseed/stac-react';
import { useParams } from 'react-router';
import { StacCollection } from 'stac-ts';
import { useShallow } from 'zustand/shallow';

import { MapPanel } from '$components/layout/map-panel';
import { EditorWorkspace } from '$components/editor/editor-workspace';
import { useLoadProject } from '$components/editor/use-load-project';
import { CodeEditor } from '$components/editor/code-editor';
import { getSceneById } from '$config/sample-scenes';
import { useEditorStore } from '$stores/editor-store';
import { NotFound } from '$pages/uhoh/error';

export function EditorPage() {
  const { sceneId } = useParams<{ sceneId: string }>();

  const scene = getSceneById(sceneId!);
  const isBlankScene = !sceneId;
  const { storedSceneId, collectionId, temporalRange, code } = useEditorStore(
    useShallow((state) => ({
      storedSceneId: state.sceneId,
      collectionId: state.selectedConfig.collectionId,
      temporalRange: state.selectedConfig.temporalRange,
      code: state.code
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
        name: scene.name,
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
        const [, end] = intervals[0];
        if (end) {
          // Convert ISO datetime to date-only format (YYYY-MM-DD)
          const endDate = new Date(end);
          // Set start date to one month before end date
          const startDate = new Date(endDate);
          startDate.setMonth(startDate.getMonth() - 1);

          const startDateStr = startDate.toISOString().split('T')[0];
          const endDateStr = endDate.toISOString().split('T')[0];
          if (!temporalRange[0] && !temporalRange[1]) {
            setTemporalRange([startDateStr, endDateStr]);
          }
        }
      }
    }
  }, [isBlankScene, collection, temporalRange, setTemporalRange]);

  const { isLoading: isLoadingProject, notFound } = useLoadProject(
    sceneId,
    scene,
    isBlankScene
  );

  // Early return
  if (isLoadingProject) {
    return (
      <Flex flex={1} alignItems='center' justifyContent='center'>
        <Spinner size='lg' />
      </Flex>
    );
  }

  if (notFound) {
    throw new NotFound(`Scene not found: ${sceneId}`);
  }

  return (
    <Flex flexDirection='column' flex={1} maxH='calc(100vh - 1rem)'>
      <Splitter.Root
        defaultSize={[50, 50]}
        panels={[
          { id: 'editor', minSize: 20 },
          { id: 'map', minSize: 20 }
        ]}
        gap={2}
      >
        <Splitter.Panel
          id='editor'
          borderWidth='1px'
          borderColor='border'
          borderRadius='uni'
          display='flex'
        >
          <CodeEditor.Root initialCode={scene?.suggestedAlgorithm || ''}>
            <EditorWorkspace
              defaultTab={isBlankScene ? 'configuration' : 'code'}
              // Auto-execute only if not a blank scene. store.code covers
              // both static sample scenes (hydrated synchronously enough
              // before pyodide finishes loading) and loaded projects
              // (hydrated async by useLoadProject) - by the time
              // isExecutionReady flips true, code always reflects
              // whichever source hydrated this session.
              autoExecuteOnReady={!isBlankScene && !!code.trim()}
            />
          </CodeEditor.Root>
        </Splitter.Panel>

        <Splitter.ResizeTrigger id='editor:map' />

        <Splitter.Panel
          id='map'
          borderWidth='1px'
          borderColor='border'
          borderRadius='uni'
        >
          <MapPanel />
        </Splitter.Panel>
      </Splitter.Root>
    </Flex>
  );
}
