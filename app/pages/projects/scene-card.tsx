import {
  Badge,
  Box,
  Card,
  Flex,
  Stack,
  Heading,
  Text,
  Image,
  LinkBox,
  LinkOverlay,
  Spinner,
  CardRootProps,
  Button
} from '@chakra-ui/react';
import { useCollection } from '@developmentseed/stac-react';
import { Link } from 'react-router';

interface SceneCardProps extends Omit<CardRootProps, 'onClick'> {
  name: string;
  description: string;
  thumbnail?: string;
  collectionId?: string;
  badges?: string[];
  href?: string; // a URL that opens this entry, for middle-click and new tabs
  isBusy?: boolean;
  onOpen: () => void;
}

export function SceneCard(props: SceneCardProps) {
  const {
    name,
    description,
    thumbnail: ownThumbnail,
    collectionId,
    badges,
    href,
    isBusy,
    onOpen,
    ...rest
  } = props;
  const { collection, isLoading } = useCollection(collectionId ?? '');

  // Fall back to the STAC collection's thumbnail
  const thumbnail =
    ownThumbnail || (collection?.assets?.thumbnail?.href as string | undefined);

  const handleOpen = () => {
    if (!isBusy) onOpen();
  };

  return (
    <Card.Root
      asChild
      transition='all 0.2s'
      rounded='uni'
      _hover={{
        transform: 'translateY(-4px)',
        shadow: 'lg'
      }}
      aria-busy={isBusy}
      {...rest}
    >
      <LinkBox>
        <Card.Body gap={4} p={8}>
          {/* Thumbnail */}
          {!ownThumbnail && isLoading ? (
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
                alt={name}
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

          {/* Entry info */}
          <Stack gap={2}>
            <Heading size='md'>
              {/* Stretches over the whole card, so the card is one button */}
              <LinkOverlay asChild>
                {href ? (
                  <Link
                    to={href}
                    onClick={(e) => {
                      // Modified clicks open the link in a new tab or window.
                      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
                        return;
                      }
                      e.preventDefault();
                      handleOpen();
                    }}
                  >
                    {name}
                  </Link>
                ) : (
                  <Button unstyled cursor='pointer' onClick={handleOpen}>
                    {name}
                  </Button>
                )}
              </LinkOverlay>
            </Heading>
            <Text fontSize='sm'>{description}</Text>
            {badges && badges.length > 0 && (
              <Flex gap={1} wrap='wrap'>
                {badges.map((badge) => (
                  <Badge key={badge} size='sm'>
                    {badge}
                  </Badge>
                ))}
              </Flex>
            )}
          </Stack>
        </Card.Body>
        {isBusy && (
          <Flex
            position='absolute'
            inset={0}
            zIndex={1}
            align='center'
            justify='center'
            bg='bg/70'
            rounded='uni'
          >
            <Spinner size='xl' />
          </Flex>
        )}
      </LinkBox>
    </Card.Root>
  );
}
