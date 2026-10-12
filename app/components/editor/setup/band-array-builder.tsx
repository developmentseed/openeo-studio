import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  IconButton,
  SimpleGrid,
  Text
} from '@chakra-ui/react';
import { LuGripVertical, LuPlus, LuX } from 'react-icons/lu';

import type { BandVariable } from '$types';
import { findBandByReference } from '$utils/stac-band-parser';

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
      // Filter out any selected bands that are no longer available. A
      // selected band can be any reference the backend accepts (name, raw
      // name or common name), so it is kept as written.
      const validSelections = selectedBands.filter((reference) =>
        findBandByReference(reference, availableBands)
      );
      if (validSelections.length !== selectedBands.length) {
        onSelectionChange(validSelections);
      }
    }
  }, [availableBands, selectedBands]);

  // Get full band info for selected bands, keeping their original index
  const selectedBandDetails = selectedBands
    .map((reference, index) => ({
      reference,
      index,
      band: findBandByReference(reference, availableBands)
    }))
    .filter(
      (
        entry
      ): entry is { reference: string; index: number; band: BandVariable } =>
        entry.band !== undefined
    );

  const selectedBandSet = new Set(selectedBandDetails.map((e) => e.band));
  const availableToAdd = availableBands.filter(
    (band) => !selectedBandSet.has(band)
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

  return (
    <SimpleGrid columns={availableBands.length ? 2 : 1} gap={4}>
      {/* Available bands column */}
      <Flex direction='column' gap={2} minW={0}>
        <Text fontSize='sm' fontWeight='medium'>
          Bands available
        </Text>
        {availableBands.length === 0 && (
          <EmptyBandSlot isError>
            There are no suitable bands in this collection.
          </EmptyBandSlot>
        )}
        {availableToAdd.map((band) => (
          <Button
            key={band.name}
            variant='outline'
            onClick={() => addBand(band.name)}
            title={band.resolution && `Resolution: ${band.resolution}`}
            fontWeight='normal'
            justifyContent='space-between'
            px={3}
          >
            <BandText name={band.name} label={band.label} />
            <LuPlus />
          </Button>
        ))}
        {availableToAdd.length === 0 && availableBands.length > 0 && (
          <EmptyBandSlot>All bands selected</EmptyBandSlot>
        )}
      </Flex>

      {/* Selected bands column */}
      {availableBands.length > 0 && (
        <Flex direction='column' gap={2} minW={0}>
          <Text fontSize='sm' fontWeight='medium'>
            Bands selected
          </Text>
          {selectedBandDetails.map(({ reference, index, band }) => (
            <SelectedBandChip
              key={reference}
              index={index}
              reference={reference}
              band={band}
              onRemove={() => removeBand(index)}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              isDragging={draggedIndex === index}
            />
          ))}
          {selectedBands.length === 0 && (
            <EmptyBandSlot>No bands selected</EmptyBandSlot>
          )}
        </Flex>
      )}
    </SimpleGrid>
  );
}

/** Placeholder with the size of a band row, for empty lists. */
function EmptyBandSlot({
  children,
  isError
}: {
  children: string;
  isError?: boolean;
}) {
  return (
    <Flex
      px={3}
      py={1}
      minH={10}
      align='center'
      borderWidth='1px'
      borderStyle='dashed'
      borderColor={isError ? 'red.500' : 'border'}
      backgroundColor={isError ? 'red.50' : 'bg'}
      overflow='hidden'
      borderRadius='uni'
    >
      <Text
        fontSize='sm'
        color={isError ? 'red.700' : 'fg.muted'}
        title={children}
      >
        {children}
      </Text>
    </Flex>
  );
}

/** Band name followed by its muted label. */
function BandText({ name, label }: { name: string; label: string }) {
  return (
    <Flex align='baseline' gap={2} minW={0} flex={1}>
      <Text fontSize='sm' flexShrink={0}>
        {name}
      </Text>
      {label !== name && (
        <Text fontSize='sm' color='fg.muted' truncate>
          {label}
        </Text>
      )}
    </Flex>
  );
}

interface SelectedBandChipProps {
  /** Band reference as stored in the scene (name, raw name or common name) */
  reference: string;
  band: BandVariable;
  index: number;
  onRemove: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

function SelectedBandChip({
  reference,
  band,
  index,
  onRemove,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging
}: SelectedBandChipProps) {
  return (
    <Flex alignItems='center' gap={3} opacity={isDragging ? 0.5 : 1}>
      <Text
        fontSize='sm'
        color='fg.muted'
        minW='3'
        textAlign='right'
        fontVariantNumeric='tabular-nums'
      >
        {index}
      </Text>
      <Flex
        draggable
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        flex={1}
        minW={0}
        h={10}
        align='center'
        borderWidth='1px'
        borderColor='border'
        borderRadius='uni'
        overflow='hidden'
        cursor='grab'
        _active={{ cursor: 'grabbing' }}
      >
        <Flex
          align='center'
          justify='center'
          alignSelf='stretch'
          px={1}
          bg='bg.muted'
          color='fg.subtle'
          flexShrink={0}
        >
          <LuGripVertical size={16} />
        </Flex>
        <Box flex={1} minW={0} px={3}>
          <BandText name={reference} label={band.label} />
        </Box>
        <IconButton
          size='sm'
          variant='ghost'
          onClick={onRemove}
          aria-label={`Remove band ${reference}`}
          mr={1}
          p={1}
          minW={7}
          w='auto'
          h={7}
        >
          <LuX />
        </IconButton>
      </Flex>
    </Flex>
  );
}
