import { Text } from '@chakra-ui/react';
import type { StacItem } from 'stac-ts';

interface StacMetadataProps {
  item: StacItem;
}

export function StacMetadata({ item }: StacMetadataProps) {
  return (
    <>
      {item.bbox && (
        <Text textWrap='pretty' fontSize='sm' color='base.600' mt={1}>
          Bbox: [{item.bbox.map((coord: number) => coord.toFixed(4)).join(', ')}
          ]
        </Text>
      )}

      {item.properties?.datetime && (
        <Text textWrap='pretty' fontSize='sm' color='base.600' mt={1}>
          Datetime: {new Date(item.properties.datetime).toLocaleString()}
        </Text>
      )}
    </>
  );
}
