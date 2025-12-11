import { useState } from 'react';
import { Flex, IconButton, Button, Dialog } from '@chakra-ui/react';
import { useItem } from 'stac-react';
import { EditorPanel } from '$components/layout/editor-panel';
import { MapPanel } from '$components/layout/map-panel';
import { StacItemCard } from '$components/stac/stac-item-card';
import { SampleScene } from '../config/sample-scenes';

interface EditorPageProps {
  scene: SampleScene;
  onBack: () => void;
}

export function EditorPage({ scene, onBack }: EditorPageProps) {
  const [tileUrl, setTileUrl] = useState<string | undefined>();
  const [isInspectOpen, setIsInspectOpen] = useState(false);
  const { item, isLoading, error } = useItem(scene.stacUrl);

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
          ←
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
          Inspect
        </Button>
      </Flex>

      {/* Editor and Map panels */}
      <Flex flexGrow={1} minHeight={0}>
        <EditorPanel
          setTileUrl={setTileUrl}
          initialCode={scene.suggestedAlgorithm}
        />
        <MapPanel item={item} tileUrl={tileUrl} />
      </Flex>

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
