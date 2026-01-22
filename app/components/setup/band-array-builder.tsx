import React, { useState, useEffect } from 'react';
import { Box, Button, Flex, Text, useRecipe } from '@chakra-ui/react';

import { RemoveIconButton } from '$components/editor/icon-buttons';
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
    <Box>
      <Text fontSize='sm' fontWeight='medium'>
        Bands
      </Text>
      <Flex gap={4} flex={1} minHeight={0}>
        {/* Available bands column */}
        <Flex direction='column' gap={2} flex={1} minHeight={0}>
          <Text fontSize='sm'>Available</Text>
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
            <Text fontSize='sm'>Selected</Text>
            <Flex direction='column' gap={1} flex={1} overflowY='auto'>
              {selectedBandDetails.map((band, index) => (
                <SelectedBandChip
                  key={`${band.name}`}
                  index={index}
                  band={band}
                  onRemove={() => removeBand(index)}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  isDragging={draggedIndex === index}
                />
              ))}
              {selectedBands.length === 0 && (
                <Text fontSize='xs' color='gray.500' fontStyle='italic'>
                  Click bands to add
                </Text>
              )}
            </Flex>
          </Flex>
        )}
      </Flex>
    </Box>
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
  const button = useRecipe({ key: 'button' });
  const styles = button({
    variant: 'outline',
    size: 'xs'
  });
  return (
    <Flex alignItems='center' opacity={isDragging ? 0.5 : 1}>
      <Box minW='14' flexShrink={0}>
        <Text fontSize='xs' color='gray.700'>
          data[{index}]:
        </Text>
      </Box>
      <Flex
        css={styles}
        draggable
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        transition='all 0.2s'
        cursor='grab'
        _active={{ cursor: 'grabbing' }}
        flex={1}
        gap={2}
        alignItems='center'
        justifyContent='space-between'
        color='gray.500'
      >
        <svg
          version='1.1'
          xmlns='http://www.w3.org/2000/svg'
          width='16'
          height='16'
          viewBox='0 0 16 16'
          fill='currentColor'
        >
          <rect width='16' height='16' id='icon-bound' fill='none' />
          <path
            id='grip-vertical'
            d='M7,13L5,13L5,15L7,15L7,13ZM11,13L9,13L9,15L11,15L11,13ZM7,9L5,9L5,11L7,11L7,9ZM11,9L9,9L9,11L11,11L11,9ZM7,5L5,5L5,7L7,7L7,5ZM11,5L9,5L9,7L11,7L11,5ZM7,1L5,1L5,3L7,3L7,1ZM11,1L9,1L9,3L11,3L11,1Z'
          />
        </svg>
        <Box textAlign='left' flex={1} color='fg'>
          {band.variable}{' '}
          {band.name && (
            <Text as='span' fontSize='xs' color='gray.500' ml={1}>
              {band.name}
            </Text>
          )}
        </Box>
        <RemoveIconButton onClick={onRemove} />
      </Flex>
    </Flex>
  );
}
