import {
  Box,
  Card,
  Flex,
  Heading,
  Text,
  Image,
  Spinner,
  SimpleGrid,
  Badge
} from '@chakra-ui/react';
import {
  useOpenEOCollections,
  extractCollectionSummaries
} from '$utils/openeo-collections';

interface CollectionBrowserProps {
  onSelectCollection: (collectionId: string) => void;
}

export function CollectionBrowser({
  onSelectCollection
}: CollectionBrowserProps) {
  const {
    data: collectionsResponse,
    isLoading,
    error
  } = useOpenEOCollections();

  if (isLoading) {
    return (
      <Flex alignItems='center' justifyContent='center' minH='200px'>
        <Spinner size='lg' />
        <Text ml={4}>Loading collections...</Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex alignItems='center' justifyContent='center' minH='200px'>
        <Text color='red.500'>
          Error loading collections:{' '}
          {error instanceof Error ? error.message : 'Unknown error'}
        </Text>
      </Flex>
    );
  }

  if (!collectionsResponse?.collections?.length) {
    return (
      <Flex alignItems='center' justifyContent='center' minH='200px'>
        <Text color='gray.500'>No collections available</Text>
      </Flex>
    );
  }

  const collections = extractCollectionSummaries(
    collectionsResponse.collections
  );

  return (
    <Box>
      <Heading size='md' mb={4} color='gray.700'>
        Explore Collections
      </Heading>
      <Text fontSize='sm' color='gray.600' mb={6}>
        Browse all available data collections and start exploring with any
        dataset.
      </Text>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        {collections.map((collection) => (
          <Card.Root
            key={collection.id}
            onClick={() => onSelectCollection(collection.id)}
            cursor='pointer'
            transition='all 0.2s'
            _hover={{
              transform: 'translateY(-2px)',
              shadow: 'md'
            }}
          >
            <Card.Body gap={3}>
              {/* Thumbnail */}
              {collection.thumbnail ? (
                <Image
                  src={collection.thumbnail}
                  alt={collection.title}
                  height='150px'
                  width='100%'
                  objectFit='cover'
                  borderRadius='md'
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <Box
                  height='150px'
                  width='100%'
                  bg='gray.200'
                  borderRadius='md'
                  display='flex'
                  alignItems='center'
                  justifyContent='center'
                >
                  <Text color='gray.500' fontSize='sm'>
                    No Preview
                  </Text>
                </Box>
              )}

              {/* Collection info */}
              <Flex flexDirection='column' gap={2}>
                <Heading size='sm' noOfLines={2}>
                  {collection.title}
                </Heading>

                <Text fontSize='xs' color='gray.600' noOfLines={3}>
                  {collection.description}
                </Text>

                {/* Collection ID badge */}
                <Badge
                  colorScheme='blue'
                  size='sm'
                  alignSelf='flex-start'
                  fontSize='xs'
                >
                  {collection.id}
                </Badge>

                {/* Keywords if available */}
                {collection.keywords.length > 0 && (
                  <Flex gap={1} flexWrap='wrap' mt={1}>
                    {collection.keywords.slice(0, 3).map((keyword) => (
                      <Badge
                        key={keyword}
                        variant='outline'
                        size='sm'
                        fontSize='xs'
                        color='gray.600'
                      >
                        {keyword}
                      </Badge>
                    ))}
                    {collection.keywords.length > 3 && (
                      <Badge
                        variant='outline'
                        size='sm'
                        fontSize='xs'
                        color='gray.500'
                      >
                        +{collection.keywords.length - 3}
                      </Badge>
                    )}
                  </Flex>
                )}
              </Flex>
            </Card.Body>
          </Card.Root>
        ))}
      </SimpleGrid>
    </Box>
  );
}
