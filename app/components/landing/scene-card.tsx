import {
  Box,
  Card,
  Stack,
  Heading,
  Text,
  Image,
  Spinner,
  CardRootProps
} from '@chakra-ui/react';
import { useCollection } from '@developmentseed/stac-react';
import { SampleScene } from '$types';
import SmartLink from '$utils/smart-link';

interface SceneCardProps extends CardRootProps {
  scene: SampleScene;
}

export function SceneCard(props: SceneCardProps) {
  const { scene, ...rest } = props;
  const { collection, isLoading } = useCollection(scene.collectionId);

  // Extract thumbnail from STAC item assets
  const thumbnail = scene.thumbnail || collection?.assets?.thumbnail?.href;

  return (
    <Card.Root
      cursor='pointer'
      asChild
      transition='all 0.2s'
      rounded='uni'
      _hover={{
        transform: 'translateY(-4px)',
        shadow: 'lg'
      }}
      {...rest}
    >
      <SmartLink to={`/editor/${scene.id}`} unstyled>
        <Card.Body gap={4} p={8}>
          {/* Thumbnail */}
          {isLoading ? (
            <Box
              height='200px'
              width='100%'
              rounded='uni'
              display='flex'
              alignItems='center'
              justifyContent='center'
            >
              <Spinner size='lg' />
            </Box>
          ) : thumbnail ? (
            <Box m={-8} mb={0}>
              <Image
                src={thumbnail}
                alt={scene.name}
                height='200px'
                width='100%'
                objectFit='cover'
                roundedTop='uni'
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </Box>
          ) : null}

          {/* Scene info */}
          <Stack gap={2}>
            <Heading size='md'>{scene.name}</Heading>
            <Text fontSize='sm'>{scene.description}</Text>
          </Stack>
        </Card.Body>
      </SmartLink>
    </Card.Root>
  );
}
