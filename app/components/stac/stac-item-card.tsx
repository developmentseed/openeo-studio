import { Flex, Heading, Text } from '@chakra-ui/react';
import { StacMetadata } from './stac-metadata';
import { StacProperties } from './stac-properties';
import type { StacItem } from 'stac-ts';

interface StacItemCardProps {
  item: StacItem | null;
  isLoading: boolean;
  error: unknown;
}

export function StacItemCard({ item, isLoading, error }: StacItemCardProps) {
  if (isLoading) {
    return <Text textWrap='pretty'>Loading STAC item...</Text>;
  }

  if (error) {
    return <Text textWrap='pretty'>Error: {JSON.stringify(error)}</Text>;
  }

  if (!item) {
    return null;
  }

  return (
    <Flex flexDir='column' gap={2}>
      <Heading fontSize='sm'>Scene: {item.id}</Heading>
      <StacMetadata item={item} />
      <StacProperties item={item} />
    </Flex>
  );
}
