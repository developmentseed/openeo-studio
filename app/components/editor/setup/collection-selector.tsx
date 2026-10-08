import { useMemo } from 'react';
import { Field, NativeSelect } from '@chakra-ui/react';
import { useCollection, useCollections } from '@developmentseed/stac-react';
import { StacCollection } from 'stac-ts';

import { isCollectionCompatible } from '$utils/stac-band-parser';

interface CollectionSelectorProps {
  collectionId: string;
  selectedBands: string[];
  onChange: (collectionId: string) => void;
}

/**
 * Collection dropdown. It only lists the collections that can resolve all
 * the selected band references, so that changing the collection does not
 * make the run fail.
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
    const compatible = allCollections.filter(
      (collection) =>
        collection.id === collectionId ||
        isCollectionCompatible(collection, selectedBands)
    );
    // Always keep the current collection, even when the list is not loaded.
    if (!compatible.some((collection) => collection.id === collectionId)) {
      compatible.unshift(current ?? ({ id: collectionId } as StacCollection));
    }
    return compatible;
  }, [allCollections, collectionId, current, selectedBands]);

  return (
    <Field.Root>
      <Field.Label htmlFor='collection'>Collection</Field.Label>
      <NativeSelect.Root size='sm' disabled={isLoading}>
        <NativeSelect.Field
          id='collection'
          value={collectionId}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((collection) => (
            <option key={collection.id} value={collection.id}>
              {collection.title || collection.id}
            </option>
          ))}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
      {allCollections.length > 0 && (
        <Field.HelperText>
          Showing {options.length} of {allCollections.length} collections that
          provide the selected bands.
        </Field.HelperText>
      )}
    </Field.Root>
  );
}
