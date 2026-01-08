import { useState } from 'react';
import { Flex, Text, Input, Collapsible, Spinner } from '@chakra-ui/react';
import { CollapseIconButton } from './icon-buttons';
import {
  useOpenEOCollections,
  extractCollectionSummaries
} from '$utils/openeo-collections';

interface CollectionConfigProps {
  collectionId: string;
  temporalRange: [string, string];
  onCollectionChange?: (collectionId: string) => void;
  onTemporalRangeChange?: (temporalRange: [string, string]) => void;
}

/**
 * Collection and temporal parameter configuration panel.
 * Allows users to modify the collection ID and temporal extent.
 */
export function CollectionConfig({
  collectionId,
  temporalRange,
  onCollectionChange,
  onTemporalRangeChange
}: CollectionConfigProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localCollectionId, setLocalCollectionId] = useState(collectionId);
  const [localStartDate, setLocalStartDate] = useState(temporalRange[0]);
  const [localEndDate, setLocalEndDate] = useState(temporalRange[1]);

  // Fetch available collections
  const {
    data: collectionsResponse,
    isLoading: collectionsLoading,
    error: collectionsError
  } = useOpenEOCollections();
  const collections = collectionsResponse
    ? extractCollectionSummaries(collectionsResponse.collections)
    : [];

  const handleCollectionIdChange = (value: string) => {
    setLocalCollectionId(value);
    onCollectionChange?.(value);
  };

  const handleStartDateChange = (value: string) => {
    setLocalStartDate(value);
    onTemporalRangeChange?.([value, localEndDate]);
  };

  const handleEndDateChange = (value: string) => {
    setLocalEndDate(value);
    onTemporalRangeChange?.([localStartDate, value]);
  };

  return (
    <Flex
      direction='column'
      gap={2}
      borderWidth='2px'
      borderColor='gray.300'
      layerStyle='handDrawn'
      flexShrink={0}
    >
      <Flex
        alignItems='center'
        justifyContent='space-between'
        p={3}
        pb={isOpen ? 2 : 3}
        cursor='pointer'
        onClick={() => setIsOpen(!isOpen)}
        _hover={{ bg: 'gray.50' }}
      >
        <Text fontSize='sm' fontWeight='bold' color='gray.700'>
          Select collection & time
        </Text>
        <CollapseIconButton isOpen={isOpen} />
      </Flex>

      <Collapsible.Root open={isOpen}>
        <Collapsible.Content>
          <Flex direction='column' gap={3} px={3} pb={3}>
            {/* Collection Selection */}
            <Flex direction='column' gap={1}>
              <Text fontSize='xs' fontWeight='medium' color='gray.600'>
                Collection
              </Text>
              {collectionsLoading ? (
                <Flex alignItems='center' gap={2} p={2}>
                  <Spinner size='sm' />
                  <Text fontSize='sm' color='gray.500'>
                    Loading collections...
                  </Text>
                </Flex>
              ) : collectionsError ? (
                <Flex direction='column' gap={2}>
                  <Text fontSize='sm' color='red.500'>
                    Error loading collections: {String(collectionsError)}
                  </Text>
                  <Input
                    value={localCollectionId}
                    onChange={(e) => handleCollectionIdChange(e.target.value)}
                    placeholder='Enter collection ID manually'
                    size='sm'
                    fontSize='sm'
                    fontFamily='monospace'
                  />
                </Flex>
              ) : collections.length === 0 ? (
                <Flex direction='column' gap={2}>
                  <Text fontSize='sm' color='yellow.600'>
                    No collections available
                  </Text>
                  <Input
                    value={localCollectionId}
                    onChange={(e) => handleCollectionIdChange(e.target.value)}
                    placeholder='Enter collection ID manually'
                    size='sm'
                    fontSize='sm'
                    fontFamily='monospace'
                  />
                </Flex>
              ) : (
                <select
                  value={localCollectionId}
                  onChange={(e) => handleCollectionIdChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    border: '1px solid #E2E8F0',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value=''>Select a collection</option>
                  {collections
                    .filter((collection) => collection?.id)
                    .map((collection) => (
                      <option key={collection.id} value={collection.id}>
                        {collection.id} - {collection.title || collection.id}
                      </option>
                    ))}
                </select>
              )}
            </Flex>

            {/* Temporal Range */}
            <Flex direction='column' gap={2}>
              <Text fontSize='xs' fontWeight='medium' color='gray.600'>
                Temporal range
              </Text>

              <Flex gap={2} alignItems='center'>
                <Flex direction='column' gap={1} flex={1}>
                  <Text fontSize='xs' color='gray.500'>
                    Start date
                  </Text>
                  <Input
                    type='date'
                    value={localStartDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    size='sm'
                    fontSize='sm'
                  />
                </Flex>

                <Flex direction='column' gap={1} flex={1}>
                  <Text fontSize='xs' color='gray.500'>
                    End date
                  </Text>
                  <Input
                    type='date'
                    value={localEndDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    size='sm'
                    fontSize='sm'
                  />
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        </Collapsible.Content>
      </Collapsible.Root>
    </Flex>
  );
}
