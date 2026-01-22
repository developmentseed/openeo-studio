import { VStack } from '@chakra-ui/react';

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
  onTemporalRangeChange,
  onCloudCoverChange,
  onSelectedBandsChange
}: ConfigurationTabProps) {
  return (
    <VStack gap={6} align='stretch'>
      <CollectionDisplay collectionId={collectionId} />

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
