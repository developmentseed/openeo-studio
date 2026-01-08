import { useState, useMemo } from 'react';
import { Flex, IconButton, Button, Dialog, Splitter } from '@chakra-ui/react';
import { useItem } from '@developmentseed/stac-react';
import { StacItem } from 'stac-ts';

import { EditorPanel } from '$components/layout/editor-panel';
import { MapPanel } from '$components/layout/map-panel';
import { StacItemCard } from '$components/stac/stac-item-card';
import { extractBandsFromStac } from '$utils/stac-band-parser';
import type { SampleScene, ServiceInfo } from '$types';

interface EditorPageProps {
  scene: SampleScene;
  onBack: () => void;
}

export function EditorPage({ scene, onBack }: EditorPageProps) {
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [isInspectOpen, setIsInspectOpen] = useState(false);
  const { item: itemRaw, isLoading, error } = useItem(scene.stacUrl);
  const item = itemRaw as unknown as StacItem | null;

  // Extract band metadata from STAC item
  const bands = useMemo(() => extractBandsFromStac(item), [item]);

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
              collectionId: scene.collectionId,
              bands,
              selectedBands,
              temporalRange: scene.temporalRange,
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
            item={item}
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
            <Dialog.Body>
              <StacItemCard item={item} isLoading={isLoading} error={error} />
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Flex>
  );
}
