import { useState, useMemo, useEffect } from 'react';
import { Flex, Splitter } from '@chakra-ui/react';
import { useCollection } from '@developmentseed/stac-react';
import { useParams, useNavigate } from 'react-router';
import { useAuth } from 'react-oidc-context';
import { StacCollection } from 'stac-ts';

import { EditorHeader } from '$components/layout/editor-header';
import { EditorPanel } from '$components/layout/editor-panel';
import { MapPanel } from '$components/layout/map-panel';
import { extractBandsFromStac } from '$utils/stac-band-parser';
import type { ServiceInfo } from '$types';
import { getSceneById, BLANK_SCENE_ID } from '$config/sample-scenes';

export function EditorPage() {
  const { sceneId } = useParams<{ sceneId: string }>();
  const navigate = useNavigate();
  const { isLoading, isAuthenticated } = useAuth();

  const scene = getSceneById(sceneId!);
  const isBlankScene = sceneId === BLANK_SCENE_ID;

  const [services, setServices] = useState<ServiceInfo[]>([]);

  // Get defaults based on scene type
  const getSceneDefaults = () => {
    if (isBlankScene) {
      return {
        collectionId: 'sentinel-2-l2a',
        cloudCover: 50,
        temporalRange: ['', ''] as [string, string],
        defaultBands: [] as string[]
      };
    }
    return {
      collectionId: scene!.collectionId,
      cloudCover: scene!.cloudCover ?? 100,
      temporalRange: scene!.temporalRange,
      defaultBands: scene!.defaultBands ?? []
    };
  };

  const defaults = getSceneDefaults();

  // Data configuration state
  const [collectionId, _setCollectionId] = useState(defaults.collectionId);
  const [temporalRange, setTemporalRange] = useState(defaults.temporalRange);
  const [cloudCover, setCloudCover] = useState(defaults.cloudCover);
  const [selectedBands, setSelectedBands] = useState(defaults.defaultBands);

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
          setTemporalRange([startDateStr, endDateStr]);
        }
      }
    }
  }, [isBlankScene, collection]);

  // Extract band metadata from STAC item
  const bands = useMemo(() => extractBandsFromStac(collection), [collection]);
  const mapBounds = useMemo(
    () => (isBlankScene ? undefined : scene?.boundingBox),
    [isBlankScene, scene]
  );

  // Early return
  if (isLoading) {
    return null; // Still loading auth state
  }

  if (!scene && !isBlankScene) {
    // Scene not found and not blank scene - navigate back
    navigate('/', { replace: true });
    return null;
  }

  // Handle layer visibility toggle
  const handleToggleLayer = (serviceId: string) => {
    setServices((prevServices) =>
      prevServices.map((service) =>
        service.id === serviceId
          ? { ...service, visible: !service.visible }
          : service
      )
    );
  };

  // Handle temporal range changes - immediately updates state and clears services
  const handleTemporalRangeChange = (newTemporalRange: [string, string]) => {
    setTemporalRange(newTemporalRange);
    // Clear services when temporal range changes
    setServices([]);
  };

  // Handle cloud cover changes - immediately updates state and clears services
  const handleCloudCoverChange = (newCloudCover: number) => {
    setCloudCover(newCloudCover);
    // Clear services when cloud cover changes
    setServices([]);
  };

  return (
    <Flex flexDirection='column' flex={1} minHeight={0}>
      <EditorHeader
        sceneName={isBlankScene ? '...' : scene!.name}
        collectionId={collectionId}
        temporalRange={temporalRange}
        cloudCover={cloudCover}
      />

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
            config={{
              collectionId,
              selectedBands,
              temporalRange,
              boundingBox: isBlankScene ? undefined : scene!.boundingBox,
              cloudCover
            }}
            availableBands={bands}
            initialCode={scene?.suggestedAlgorithm || ''}
            setServices={setServices}
            onSelectedBandsChange={setSelectedBands}
            onTemporalRangeChange={handleTemporalRangeChange}
            onCloudCoverChange={handleCloudCoverChange}
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
          <MapPanel
            bounds={mapBounds}
            services={services}
            onToggleLayer={handleToggleLayer}
          />
        </Splitter.Panel>
      </Splitter.Root>
    </Flex>
  );
}
