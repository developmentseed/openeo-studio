import { useMemo } from 'react';
import { Field, Flex, Input, VStack, Text } from '@chakra-ui/react';
import { useCollection } from '@developmentseed/stac-react';
import { StacCollection } from 'stac-ts';
import { useShallow } from 'zustand/shallow';

import { CollectionDisplay } from '$components/setup/collection-display';
import { TemporalRangePicker } from '$components/setup/temporal-range-picker';
import { CloudCoverSlider } from '$components/setup/cloud-cover-slider';
import { BandArrayBuilder } from '$components/setup/band-array-builder';
import { extractBandsFromStac } from '$utils/stac-band-parser';
import { useEditorStore } from '$stores/editor-store';

export function ConfigurationTab() {
  const sceneName = useEditorStore((state) => state.sceneName);
  const selectedConfig = useEditorStore(
    useShallow((state) => state.selectedConfig)
  );
  const { setSceneName, setTemporalRange, setCloudCover, setSelectedBands } =
    useEditorStore();

  const { collection: collectionRaw } = useCollection(
    selectedConfig.collectionId
  );
  const collection = collectionRaw as unknown as StacCollection | null;
  const availableBands = useMemo(
    () => extractBandsFromStac(collection),
    [collection]
  );

  return (
    <VStack gap={6} align='stretch'>
      <Field.Root>
        <Field.Label htmlFor='scene-name'>Title</Field.Label>
        <Input
          id='scene-name'
          value={sceneName}
          onChange={(e) => setSceneName(e.target.value)}
          placeholder='New Scene'
        />
      </Field.Root>

      <CollectionDisplay collectionId={selectedConfig.collectionId} />

      {selectedConfig.boundingBox && (
        <VStack align='stretch' gap={2}>
          <Text fontSize='sm' fontWeight='medium'>
            Bounding Box
          </Text>
          <Flex fontSize='xs' fontFamily='mono' p={3} color='gray.600' gap={4}>
            <Text>West: {selectedConfig.boundingBox[0].toFixed(4)}</Text>
            <Text>South: {selectedConfig.boundingBox[1].toFixed(4)}</Text>
            <Text>East: {selectedConfig.boundingBox[2].toFixed(4)}</Text>
            <Text>North: {selectedConfig.boundingBox[3].toFixed(4)}</Text>
          </Flex>
        </VStack>
      )}

      <TemporalRangePicker
        temporalRange={selectedConfig.temporalRange}
        onTemporalRangeChange={setTemporalRange}
      />

      <CloudCoverSlider
        cloudCover={selectedConfig.cloudCover || 100}
        onCloudCoverChange={setCloudCover}
      />

      {availableBands.length > 0 && (
        <BandArrayBuilder
          availableBands={availableBands}
          selectedBands={selectedConfig.selectedBands || []}
          onSelectionChange={setSelectedBands}
        />
      )}
    </VStack>
  );
}
