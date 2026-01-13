import { useState, useMemo } from 'react';
import { Flex, IconButton, Button, Dialog, Splitter } from '@chakra-ui/react';
import { useCollection } from '@developmentseed/stac-react';

import { EditorPanel } from '$components/layout/editor-panel';
import { MapPanel } from '$components/layout/map-panel';
import { DataConfigDialog } from '$components/stac/data-config-dialog';
import { extractBandsFromStac } from '$utils/stac-band-parser';
import type { SampleScene, ServiceInfo } from '$types';
import { StacCollection } from 'stac-ts';

interface EditorPageProps {
  scene: SampleScene;
  onBack: () => void;
}

export function EditorPage({ scene, onBack }: EditorPageProps) {
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [isInspectOpen, setIsInspectOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Data configuration state
  const [collectionId, setCollectionId] = useState(scene.collectionId);
  const [temporalRange, setTemporalRange] = useState<[string, string]>(
    scene.temporalRange
  );
  const [cloudCover, setCloudCover] = useState(100);

  const { collection: collectionRaw } = useCollection(collectionId);
  const collection = collectionRaw as unknown as StacCollection | null;

  // Extract band metadata from STAC item
  const bands = useMemo(() => extractBandsFromStac(collection), [collection]);
  // Manage selected bands for data[] array
  const [selectedBands, setSelectedBands] = useState<string[]>(
    scene.defaultBands
  );

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
  };

  const mapBounds = useMemo(() => {
    return collection?.extent?.spatial?.bbox?.[0] as [
      number,
      number,
      number,
      number
    ];
  }, [collection]);

  return (
    <Flex flexDirection='column' flex={1} minHeight={0}>
      {/* Sub-header with back button and scene info */}
      <Flex
        alignItems='center'
        gap={4}
        px={6}
        py={3}
        borderBottomWidth='1px'
        borderColor='gray.200'
        bg='gray.50'
      >
        <IconButton
          aria-label='Back to scenes'
          onClick={onBack}
          size='sm'
          variant='ghost'
        >
          <svg
            version='1.1'
            xmlns='http://www.w3.org/2000/svg'
            width='16'
            height='16'
            viewBox='0 0 16 16'
          >
            <rect width='16' height='16' id='icon-bound' fill='none' />
            <polygon points='8.414,13.586 3.828,9 16,9 16,7 3.828,7 8.414,2.414 7,1 0,8 7,15' />
          </svg>
        </IconButton>
        <Flex flexDirection='column' flex={1}>
          <Flex fontSize='md' fontWeight='semibold'>
            {scene.name}
          </Flex>
          <Flex fontSize='xs' color='gray.600'>
            {scene.description}
          </Flex>
        </Flex>
        <Button
          size='sm'
          variant='outline'
          layerStyle='handDrawn'
          onClick={() => setIsInspectOpen(true)}
        >
          Inspect Metadata
          <svg
            version='1.1'
            xmlns='http://www.w3.org/2000/svg'
            width='16'
            height='16'
            viewBox='0 0 16 16'
          >
            <rect width='16' height='16' id='icon-bound' fill='none' />
            <path d='M8,2C2,2 0,8 0,8C0,8 2,14 8,14C14,14 16,8 16,8C16,8 14,2 8,2ZM8,12C4.519,12 2.787,9.272 2.168,8C2.481,7.358 3.082,6.34 4.051,5.491C4.03,5.66 4,5.826 4,6C4,8.209 5.791,10 8,10C10.209,10 12,8.209 12,6C12,5.825 11.97,5.658 11.949,5.49C12.917,6.338 13.519,7.356 13.832,8C13.214,9.267 11.479,12 8,12Z' />
          </svg>
        </Button>
        <Button
          size='sm'
          variant='outline'
          layerStyle='handDrawn'
          onClick={() => setIsConfigOpen(true)}
        >
          Update Configuration
          <svg
            version='1.1'
            xmlns='http://www.w3.org/2000/svg'
            width='16'
            height='16'
            viewBox='0 0 16 16'
          >
            <rect width='16' height='16' id='icon-bound' fill='none' />
            <path d='M14.8,7.5l-1.4-0.3c-0.1-0.3-0.2-0.6-0.3-0.9l0.8-1.2c0.2-0.3,0.2-0.7-0.1-1l-0.7-0.7c-0.3-0.3-0.7-0.3-1-0.1l-1.2,0.8c-0.3-0.1-0.6-0.2-0.9-0.3L9.5,1.2C9.4,0.9,9.2,0.7,8.9,0.6L8,0.5C7.7,0.5,7.4,0.6,7.3,0.9L7,2.3c-0.3,0.1-0.6,0.2-0.9,0.3L5,1.8c-0.3-0.2-0.7-0.2-1,0.1L3.3,2.6C3,2.9,3,3.3,3.2,3.6l0.8,1.2c-0.1,0.3-0.2,0.6-0.3,0.9l-1.4,0.3c-0.3,0.1-0.6,0.3-0.6,0.6L1.5,8c0,0.3,0.2,0.6,0.5,0.7l1.4,0.3c0.1,0.3,0.2,0.6,0.3,0.9l-0.8,1.2c-0.2,0.3-0.2,0.7,0.1,1l0.7,0.7c0.3,0.3,0.7,0.3,1,0.1l1.2-0.8c0.3,0.1,0.6,0.2,0.9,0.3l0.3,1.4c0.1,0.3,0.3,0.6,0.6,0.6L9,14.5c0.3,0,0.6-0.2,0.7-0.5l0.3-1.4c0.3-0.1,0.6-0.2,0.9-0.3l1.2,0.8c0.3,0.2,0.7,0.2,1-0.1l0.7-0.7c0.3-0.3,0.3-0.7,0.1-1l-0.8-1.2c0.1-0.3,0.2-0.6,0.3-0.9l1.4-0.3c0.3-0.1,0.6-0.3,0.6-0.6L15.5,7C15.5,6.7,15.3,6.4,14.8,7.5z M8,10.5c-1.4,0-2.5-1.1-2.5-2.5S6.6,5.5,8,5.5s2.5,1.1,2.5,2.5S9.4,10.5,8,10.5z' />
          </svg>
        </Button>
      </Flex>

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
              bands,
              selectedBands,
              temporalRange,
              parameterDefaults: scene.parameterDefaults
            }}
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

      {/* STAC Item Inspection Modal */}
      <Dialog.Root
        open={isInspectOpen}
        onOpenChange={(e) => setIsInspectOpen(e.open)}
        size='lg'
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Scene Information</Dialog.Title>
              <Dialog.CloseTrigger />
            </Dialog.Header>
            <Dialog.Body>{/* TODO */}🚧 WIP</Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Data Configuration Modal */}
      <DataConfigDialog
        open={isConfigOpen}
        onOpenChange={(e) => setIsConfigOpen(e.open)}
        collectionId={collectionId}
        temporalRange={temporalRange}
        cloudCover={cloudCover}
        onApply={handleConfigApply}
      />
    </Flex>
  );
}
