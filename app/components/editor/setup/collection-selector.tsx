import { useMemo } from 'react';
import {
  Badge,
  createListCollection,
  Flex,
  Portal,
  Select
} from '@chakra-ui/react';
import { useCollection, useCollections } from '@developmentseed/stac-react';
import { LuTriangleAlert } from 'react-icons/lu';
import { StacCollection } from 'stac-ts';

import {
  collectionBandIdentifiers,
  isCollectionCompatible
} from '$utils/stac-band-parser';
import { Tip } from '$components/tooltip';

interface CollectionSelectorProps {
  collectionId: string;
  selectedBands: string[];
  onChange: (collectionId: string) => void;
}

interface CollectionOption {
  id: string;
  label: string;
  compatible: boolean;
  hasBands: boolean;
}

/**
 * Collection dropdown. It lists all the collections and flags the ones that
 * cannot resolve all the selected band references, because changing to one
 * of them drops the bands it does not provide.
 */
export function CollectionSelector({
  collectionId,
  selectedBands,
  onChange
}: CollectionSelectorProps) {
  const { collections, isLoading } = useCollections();
  const { collection: currentRaw } = useCollection(collectionId);
  const current = currentRaw as unknown as StacCollection | null;

  const allCollections = useMemo(
    () => (collections?.collections ?? []) as unknown as StacCollection[],
    [collections]
  );

  const options = useMemo(() => {
    const list = [...allCollections];
    // Always keep the current collection, even when the list is not loaded.
    if (!list.some((collection) => collection.id === collectionId)) {
      list.unshift(current ?? ({ id: collectionId } as StacCollection));
    }
    return createListCollection<CollectionOption>({
      items: list.map((collection) => ({
        id: collection.id,
        label: collection.title || collection.id,
        hasBands: collectionBandIdentifiers(collection).size > 0,
        compatible:
          !selectedBands.length ||
          collection.id === collectionId ||
          isCollectionCompatible(collection, selectedBands)
      })),
      itemToValue: (item) => item.id,
      itemToString: (item) => item.label
    });
  }, [allCollections, collectionId, current, selectedBands]);

  return (
    <Select.Root
      collection={options}
      size='sm'
      disabled={isLoading}
      value={[collectionId]}
      onValueChange={(details) => {
        const [value] = details.value;
        if (value) onChange(value);
      }}
    >
      <Select.HiddenSelect />
      <Select.Label>Collection</Select.Label>
      <Select.Control>
        <Select.Trigger>
          <Select.ValueText placeholder='Select a collection' />
        </Select.Trigger>
        <Select.IndicatorGroup>
          <Select.Indicator />
        </Select.IndicatorGroup>
      </Select.Control>
      <Portal>
        <Select.Positioner>
          <Select.Content>
            {options.items.map((item) => (
              <Select.Item key={item.id} item={item}>
                <Flex align='center' gap={2} flex={1} minW={0}>
                  <Select.ItemText truncate>{item.label}</Select.ItemText>
                  {!item.hasBands ? (
                    <Tip content='This collection does not provide any suitable bands.'>
                      <Badge
                        size='xs'
                        colorPalette='error'
                        flexShrink={0}
                        ml='auto'
                      >
                        <LuTriangleAlert />
                        No bands
                      </Badge>
                    </Tip>
                  ) : !item.compatible ? (
                    <Tip content='This collection does not provide all the bands you have selected.'>
                      <Badge
                        size='xs'
                        colorPalette='warning'
                        flexShrink={0}
                        ml='auto'
                      >
                        <LuTriangleAlert />
                        Incompatible bands
                      </Badge>
                    </Tip>
                  ) : null}
                </Flex>
                <Select.ItemIndicator />
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Portal>
    </Select.Root>
  );
}
