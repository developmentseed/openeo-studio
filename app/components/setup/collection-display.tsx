import { Text, Field } from '@chakra-ui/react';
import { useCollection } from '@developmentseed/stac-react';
import { StacCollection } from 'stac-ts';

interface CollectionDisplayProps {
  collectionId: string;
}

export function CollectionDisplay({ collectionId }: CollectionDisplayProps) {
  const { collection: collectionRaw } = useCollection(collectionId);
  const collection = collectionRaw as unknown as StacCollection | null;

  return (
    <Field.Root>
      <Field.Label>Collection</Field.Label>
      <Text
        fontSize='sm'
        fontWeight='medium'
        py={2}
        px={3}
        bg='gray.50'
        borderRadius='md'
      >
        {collection?.title || collectionId}
      </Text>
    </Field.Root>
  );
}
