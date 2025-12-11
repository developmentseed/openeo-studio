import { useState } from 'react';
import { Flex, IconButton } from '@chakra-ui/react';
import { useItem } from 'stac-react';
import { EditorPanel } from '$components/layout/editor-panel';
import { MapPanel } from '$components/layout/map-panel';
import { SampleScene } from '../config/sample-scenes';

interface EditorPageProps {
  scene: SampleScene;
  onBack: () => void;
}

export function EditorPage({ scene, onBack }: EditorPageProps) {
  const [tileUrl, setTileUrl] = useState<string | undefined>();
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
        <Flex flexDirection='column'>
          <Flex fontSize='md' fontWeight='semibold'>
            {scene.name}
          </Flex>
          <Flex fontSize='xs' color='gray.600'>
            {scene.description}
          </Flex>
        </Flex>
      </Flex>

      {/* Editor and Map panels */}
      <Flex flexGrow={1} minHeight={0}>
        <EditorPanel
          item={item}
          isLoading={isLoading}
          error={error}
          setTileUrl={setTileUrl}
          initialCode={scene.suggestedAlgorithm}
        />
        <MapPanel item={item} tileUrl={tileUrl} />
      </Flex>
    </Flex>
  );
}
