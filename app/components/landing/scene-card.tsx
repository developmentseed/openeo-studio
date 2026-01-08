import {
  Box,
  Card,
  Flex,
  Heading,
  Text,
  Image,
  Spinner
} from '@chakra-ui/react';
import { useOpenEOCollection } from '$utils/openeo-collection';
import { SampleScene } from '$types';

interface SceneCardProps {
  scene: SampleScene;
  onSelect: (sceneId: string) => void;
}

export function SceneCard({ scene, onSelect }: SceneCardProps) {
  const { data: collection, isLoading } = useOpenEOCollection(
    scene.collectionId
  );

  // Use scene thumbnail if provided, otherwise fallback to collection thumbnail
  const thumbnail = scene.thumbnailUrl || collection?.assets?.thumbnail?.href;

  return (
    <Card.Root
      onClick={() => onSelect(scene.id)}
      cursor='pointer'
      transition='all 0.2s'
      _hover={{
        transform: 'translateY(-4px)',
        shadow: 'lg'
      }}
    >
      <Card.Body gap={4}>
        {/* Thumbnail */}
        {isLoading ? (
          <Box
            height='200px'
            width='100%'
            bg='gray.100'
            borderRadius='md'
            display='flex'
            alignItems='center'
            justifyContent='center'
          >
            <Spinner size='lg' />
          </Box>
        ) : thumbnail ? (
          <Image
            src={thumbnail}
            alt={scene.name}
            height='200px'
            width='100%'
            objectFit='cover'
            borderRadius='md'
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <Box
            height='200px'
            width='100%'
            bg='gray.200'
            borderRadius='md'
            display='flex'
            alignItems='center'
            justifyContent='center'
          >
            <Text color='gray.500'>No Preview</Text>
          </Box>
        )}

        {/* Scene info */}
        <Flex flexDirection='column' gap={2}>
          <Heading size='md'>{scene.name}</Heading>
          <Text fontSize='sm' color='gray.600'>
            {scene.description}
          </Text>
        </Flex>
      </Card.Body>
    </Card.Root>
  );
}
