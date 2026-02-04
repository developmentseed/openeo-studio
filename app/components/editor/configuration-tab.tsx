import { Flex, VStack, Text } from '@chakra-ui/react';

import { CollectionDisplay } from '$components/setup/collection-display';
import { TemporalRangePicker } from '$components/setup/temporal-range-picker';
import { CloudCoverSlider } from '$components/setup/cloud-cover-slider';
import { BandArrayBuilder } from '$components/setup/band-array-builder';
import type { BandVariable } from '$types';

interface ConfigurationTabProps {
  collectionId: string;
  temporalRange: [string, string];
  cloudCover: number;
  selectedBands: string[];
  availableBands?: BandVariable[];
  boundingBox?: [number, number, number, number];
  onTemporalRangeChange: (temporalRange: [string, string]) => void;
  onCloudCoverChange: (cloudCover: number) => void;
  onSelectedBandsChange?: (bands: string[]) => void;
}

export function ConfigurationTab({
  collectionId,
  temporalRange,
  cloudCover,
  selectedBands,
  availableBands,
  boundingBox,
  onTemporalRangeChange,
  onCloudCoverChange,
  onSelectedBandsChange
}: ConfigurationTabProps) {
  return (
    <VStack gap={6} align='stretch'>
      <CollectionDisplay collectionId={collectionId} />

      {boundingBox && (
        <VStack align='stretch' gap={2}>
          <Text fontSize='sm' fontWeight='medium'>
            Bounding Box
          </Text>
          <Flex fontSize='xs' fontFamily='mono' p={3} color='gray.600' gap={4}>
            <Text>West: {boundingBox[0].toFixed(4)}</Text>
            <Text>South: {boundingBox[1].toFixed(4)}</Text>
            <Text>East: {boundingBox[2].toFixed(4)}</Text>
            <Text>North: {boundingBox[3].toFixed(4)}</Text>
          </Flex>
        </VStack>
      )}

      <TemporalRangePicker
        temporalRange={temporalRange}
        onTemporalRangeChange={onTemporalRangeChange}
      />

      <CloudCoverSlider
        cloudCover={cloudCover}
        onCloudCoverChange={onCloudCoverChange}
      />

      {availableBands && onSelectedBandsChange && (
        <BandArrayBuilder
          availableBands={availableBands}
          selectedBands={selectedBands}
          onSelectionChange={onSelectedBandsChange}
        />
      )}
    </VStack>
  );
}
