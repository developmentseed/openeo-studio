import { useState } from 'react';
import { Flex, Text, Button, Collapsible } from '@chakra-ui/react';
import type { BandVariable } from '$utils/stac-band-parser';
import {
  CollapseIconButton,
  MoveUpIconButton,
  MoveDownIconButton,
  RemoveIconButton
} from './icon-buttons';

interface BandArrayBuilderProps {
  /** All available bands from STAC */
  availableBands: BandVariable[];
  /** Currently selected band names in order */
  selectedBands: string[];
  /** Callback when selection changes */
  onSelectionChange: (bands: string[]) => void;
}

/**
 * Interactive band array builder.
 * Users select which bands to load and in what order for their data[] array.
 */
export function BandArrayBuilder({
  availableBands,
  selectedBands,
  onSelectionChange
}: BandArrayBuilderProps) {
  const [isOpen, setIsOpen] = useState(true);
  const selectedBandSet = new Set(selectedBands);
  const availableToAdd = availableBands.filter(
    (band) => !selectedBandSet.has(band.name)
  );

  const addBand = (bandName: string) => {
    onSelectionChange([...selectedBands, bandName]);
  };

  const removeBand = (index: number) => {
    const newSelection = [...selectedBands];
    newSelection.splice(index, 1);
    onSelectionChange(newSelection);
  };

  const moveBand = (fromIndex: number, toIndex: number) => {
    const newSelection = [...selectedBands];
    const [removed] = newSelection.splice(fromIndex, 1);
    newSelection.splice(toIndex, 0, removed);
    onSelectionChange(newSelection);
  };

  // Get full band info for selected bands
  const selectedBandDetails = selectedBands
    .map((name) => availableBands.find((b) => b.name === name))
    .filter((b): b is BandVariable => b !== undefined);

  return (
    <Flex
      direction='column'
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
          Build your data[] array
        </Text>
        <CollapseIconButton isOpen={isOpen} />
      </Flex>

      <Collapsible.Root open={isOpen}>
        <Collapsible.Content>
          <Flex direction='column' gap={3} px={3} pb={3}>
            <Flex gap={4}>
              {/* Available bands */}
              <Flex direction='column' gap={2} flex={1}>
                <Text fontSize='xs' fontWeight='semibold' color='gray.600'>
                  Available bands
                </Text>
                <Flex
                  direction='column'
                  gap={1}
                  maxHeight='200px'
                  overflowY='auto'
                >
                  {availableToAdd.map((band) => (
                    <Button
                      key={band.name}
                      size='xs'
                      variant='outline'
                      onClick={() => addBand(band.name)}
                      justifyContent='flex-start'
                      layerStyle='handDrawn'
                    >
                      {band.variable} - {band.label}
                      {band.resolution && (
                        <Text as='span' fontSize='xs' color='gray.500' ml={1}>
                          ({band.resolution})
                        </Text>
                      )}
                    </Button>
                  ))}
                  {availableToAdd.length === 0 && (
                    <Text fontSize='xs' color='gray.500' fontStyle='italic'>
                      All bands selected
                    </Text>
                  )}
                </Flex>
              </Flex>

              {/* Selected bands */}
              <Flex direction='column' gap={2} flex={1}>
                <Text fontSize='xs' fontWeight='semibold' color='gray.600'>
                  Your data[] array
                </Text>
                <Flex
                  direction='column'
                  gap={1}
                  maxHeight='200px'
                  overflowY='auto'
                >
                  {selectedBandDetails.map((band, index) => (
                    <SelectedBandItem
                      key={band.name}
                      band={band}
                      index={index}
                      onRemove={() => removeBand(index)}
                      onMoveUp={
                        index > 0 ? () => moveBand(index, index - 1) : undefined
                      }
                      onMoveDown={
                        index < selectedBands.length - 1
                          ? () => moveBand(index, index + 1)
                          : undefined
                      }
                    />
                  ))}
                  {selectedBands.length === 0 && (
                    <Text fontSize='xs' color='gray.500' fontStyle='italic'>
                      Click bands to add
                    </Text>
                  )}
                </Flex>
              </Flex>
            </Flex>

            {/* Index mapping */}
            {selectedBandDetails.length > 0 && (
              <Flex
                direction='column'
                gap={1}
                mt={2}
                p={2}
                bg='gray.50'
                borderRadius='md'
              >
                <Text fontSize='xs' fontWeight='semibold' color='gray.700'>
                  In your viz function:
                </Text>
                {selectedBandDetails.map((band, index) => (
                  <Text
                    key={band.name}
                    fontSize='xs'
                    fontFamily='monospace'
                    color='gray.600'
                  >
                    data[{index}] = {band.variable} ({band.label}
                    {band.resolution && `, ${band.resolution}`}
                    {band.wavelength && `, ${band.wavelength}`})
                  </Text>
                ))}
              </Flex>
            )}
          </Flex>
        </Collapsible.Content>
      </Collapsible.Root>
    </Flex>
  );
}

interface SelectedBandItemProps {
  band: BandVariable;
  index: number;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

function SelectedBandItem({
  band,
  index,
  onRemove,
  onMoveUp,
  onMoveDown
}: SelectedBandItemProps) {
  return (
    <Flex
      alignItems='center'
      gap={2}
      p={2}
      bg='blue.50'
      borderRadius='md'
      borderWidth='1px'
      borderColor='blue.300'
    >
      <Text fontSize='xs' fontWeight='bold' color='gray.600' minWidth='20px'>
        {index}:
      </Text>
      <Text
        fontSize='xs'
        fontFamily='monospace'
        fontWeight='bold'
        color='blue.600'
        flex={1}
      >
        {band.variable}
      </Text>
      <Text fontSize='xs' color='gray.600'>
        {band.label}
      </Text>

      {/* Move buttons */}
      <Flex gap={1}>
        {onMoveUp && <MoveUpIconButton onClick={onMoveUp} />}
        {onMoveDown && <MoveDownIconButton onClick={onMoveDown} />}
      </Flex>

      <RemoveIconButton onClick={onRemove} />
    </Flex>
  );
}
