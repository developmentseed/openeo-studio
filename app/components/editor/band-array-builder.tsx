import React, { useState, useEffect } from 'react';
import { Flex, Text, Button, chakra } from '@chakra-ui/react';

import { RemoveIconButton } from './icon-buttons';
import type { BandVariable } from '$types';

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
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Clear invalid selections when available bands change
  useEffect(() => {
    // Only validate selections if we have bands loaded
    if (availableBands.length > 0 && selectedBands.length > 0) {
      // Filter out any selected bands that are no longer available
      const availableBandNames = new Set(availableBands.map((b) => b.name));
      const validSelections = selectedBands.filter((name) =>
        availableBandNames.has(name)
      );
      if (validSelections.length !== selectedBands.length) {
        onSelectionChange(validSelections);
      }
    }
  }, [availableBands, selectedBands]);

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

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newSelection = [...selectedBands];
    const [removed] = newSelection.splice(draggedIndex, 1);
    newSelection.splice(index, 0, removed);
    onSelectionChange(newSelection);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Get full band info for selected bands
  const selectedBandDetails = selectedBands
    .map((name) => availableBands.find((b) => b.name === name))
    .filter((b): b is BandVariable => b !== undefined);

  return (
    <>
      <Flex gap={4} flex={1} minHeight={0}>
        {/* Available bands column */}
        <Flex direction='column' gap={2} flex={1} minHeight={0}>
          <Text fontSize='sm'>Available bands</Text>
          {availableBands.length === 0 && (
            <Text fontSize='xs' color='gray.500' fontStyle='italic'>
              ⚠️ The parser could not find suitable bands in this collection.
            </Text>
          )}

          <Flex direction='column' gap={1} flex={1} overflowY='auto'>
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
            {availableToAdd.length === 0 && availableBands.length > 0 && (
              <Text fontSize='xs' color='gray.500' fontStyle='italic'>
                All bands selected
              </Text>
            )}
          </Flex>
        </Flex>

        {/* Selected bands column */}
        {availableBands.length > 0 && (
          <Flex direction='column' gap={2} flex={1} minHeight={0}>
            <Text fontSize='sm'>Selected band dimension</Text>
            <Flex
              wrap='wrap'
              flex={1}
              alignItems='center'
              alignContent='flex-start'
            >
              <Text fontSize='32px' fontWeight='light' color='gray.500'>
                [
              </Text>
              {selectedBandDetails.map((band, index) => (
                <React.Fragment key={band.name}>
                  <SelectedBandChip
                    index={index}
                    band={band}
                    onRemove={() => removeBand(index)}
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    isDragging={draggedIndex === index}
                  />
                  {index < selectedBandDetails.length - 1 && (
                    <chakra.span mr={2}>,</chakra.span>
                  )}
                </React.Fragment>
              ))}
              <Text fontSize='32px' fontWeight='light' color='gray.500'>
                ]
              </Text>
              {selectedBands.length === 0 && (
                <Text fontSize='xs' color='gray.500' fontStyle='italic'>
                  Click bands to add
                </Text>
              )}
            </Flex>
          </Flex>
        )}
      </Flex>
    </>
  );
}

interface SelectedBandChipProps {
  band: BandVariable;
  index: number;
  onRemove: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

function SelectedBandChip({
  band,
  index,
  onRemove,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging
}: SelectedBandChipProps) {
  return (
    <Flex
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      alignItems='center'
      pl={1}
      bg={isDragging ? 'blue.100' : 'blue.50'}
      borderRadius='md'
      borderWidth='2px'
      borderColor='blue.300'
      layerStyle='handDrawn'
      cursor='grab'
      opacity={isDragging ? 0.5 : 1}
      transition='all 0.2s'
      _hover={{ bg: 'blue.100', transform: 'translateY(-2px)' }}
      _active={{ cursor: 'grabbing' }}
    >
      <Text px={2} fontSize='xs' color='gray.700'>
        {index}:{' '}
      </Text>
      <Text fontSize='xs' fontWeight='bold'>
        {band.variable}
      </Text>
      <RemoveIconButton onClick={onRemove} />
    </Flex>
  );
}
