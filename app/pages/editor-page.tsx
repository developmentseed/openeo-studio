import { useState, useMemo } from 'react';
import { Flex, Splitter } from '@chakra-ui/react';
import { useCollection } from '@developmentseed/stac-react';
import { useParams, useLocation, useNavigate } from 'react-router';
import { useAuth } from 'react-oidc-context';
import { StacCollection } from 'stac-ts';

import { EditorHeader } from '$components/layout/editor-header';
import { EditorPanel } from '$components/layout/editor-panel';
import { MapPanel } from '$components/layout/map-panel';
import { DataConfigDialog } from '$components/setup/data-config-dialog';
import { extractBandsFromStac } from '$utils/stac-band-parser';
import type { ServiceInfo } from '$types';
import { getSceneById, BLANK_SCENE_ID } from '$config/sample-scenes';

export function EditorPage() {
  const { sceneId } = useParams<{ sceneId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoading } = useAuth();

  const scene = getSceneById(sceneId!);

  // For blank scenes, location.state overrides scene defaults
  const blankSceneConfig = location.state as {
    collectionId: string;
    temporalRange: [string, string];
    cloudCover: number;
  } | null;

  const isBlankScene = scene?.id === BLANK_SCENE_ID && blankSceneConfig;

  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Data configuration state
  const [collectionId, setCollectionId] = useState(
    isBlankScene ? blankSceneConfig.collectionId : scene?.collectionId || ''
  );
  const [temporalRange, setTemporalRange] = useState<[string, string]>(
    isBlankScene
      ? blankSceneConfig.temporalRange
      : scene?.temporalRange || ['', '']
  );
  const [cloudCover, setCloudCover] = useState(
    isBlankScene ? blankSceneConfig.cloudCover : scene?.cloudCover || 100
  );
  const [selectedBands, setSelectedBands] = useState<string[]>(
    scene?.defaultBands || []
  );

  const { collection: collectionRaw } = useCollection(collectionId);
  const collection = collectionRaw as unknown as StacCollection | null;

  // Extract band metadata from STAC item
  const bands = useMemo(() => extractBandsFromStac(collection), [collection]);
  const mapBounds = useMemo(() => scene?.boundingBox, [scene]);

  // Early return
  if (isLoading) {
    return null; // Still loading auth state
  }

  if (!scene) {
    // Scene not found - navigate back
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

  // Handle data configuration changes
  const handleConfigApply = (config: {
    collectionId: string;
    temporalRange: [string, string];
    cloudCover: number;
  }) => {
    const collectionChanged = config.collectionId !== collectionId;

    setCollectionId(config.collectionId);
    setTemporalRange(config.temporalRange);
    setCloudCover(config.cloudCover);

    // Clear services when data config changes
    setServices([]);

    // Reset band selection if collection changed
    if (collectionChanged) {
      setSelectedBands([]);
    }

    // Close modal after config is applied
    setIsConfigOpen(false);
  };

  const handleConfigOpenChange = (e: { open: boolean }) => {
    setIsConfigOpen(e.open);
  };

  return (
    <Flex flexDirection='column' flex={1} minHeight={0}>
      <EditorHeader
        sceneName={scene.name}
        collectionId={collectionId}
        temporalRange={temporalRange}
        cloudCover={cloudCover}
        onConfigOpen={() => setIsConfigOpen(true)}
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
              boundingBox: scene.boundingBox,
              cloudCover
            }}
            availableBands={bands}
            initialCode={scene.suggestedAlgorithm}
            setServices={setServices}
            onSelectedBandsChange={setSelectedBands}
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

      {/* Data Configuration Modal */}
      <DataConfigDialog
        open={isConfigOpen}
        onOpenChange={handleConfigOpenChange}
        collectionId={collectionId}
        temporalRange={temporalRange}
        cloudCover={cloudCover}
        onApply={handleConfigApply}
      />
    </Flex>
  );
}
