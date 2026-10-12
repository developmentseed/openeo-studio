import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  IconButton,
  Portal,
  SimpleGrid,
  Text
} from '@chakra-ui/react';
import {
  defaultDropAnimationSideEffects,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DropAnimation,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  const [activeReference, setActiveReference] = useState<string | null>(null);
  const sensors = useSensors(
    // A small distance keeps clicks on the remove button from starting a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

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

  const activeEntry = selectedBandDetails.find(
    (entry) => entry.reference === activeReference
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveReference(null);
    if (!over || active.id === over.id) return;
    const from = selectedBands.indexOf(String(active.id));
    const to = selectedBands.indexOf(String(over.id));
    onSelectionChange(arrayMove(selectedBands, from, to));
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={({ active }) => setActiveReference(String(active.id))}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveReference(null)}
          >
            <SortableContext
              items={selectedBandDetails.map((entry) => entry.reference)}
              strategy={verticalListSortingStrategy}
            >
              {selectedBandDetails.map(({ reference, index, band }) => (
                <Flex key={reference} alignItems='center' gap={3}>
                  <Text
                    fontSize='sm'
                    color='fg.muted'
                    minW='3'
                    textAlign='right'
                    fontVariantNumeric='tabular-nums'
                  >
                    {index}
                  </Text>
                  <SortableBandChip
                    reference={reference}
                    band={band}
                    onRemove={() => removeBand(index)}
                  />
                </Flex>
              ))}
            </SortableContext>
            <Portal>
              <DragOverlay dropAnimation={dropAnimation}>
                {activeEntry && (
                  <BandChip
                    reference={activeEntry.reference}
                    band={activeEntry.band}
                    isOverlay
                  />
                )}
              </DragOverlay>
            </Portal>
          </DndContext>
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

/** Tilt of the band that is being dragged. */
const DRAG_TILT = '2deg';

/**
 * Lands the dragged band in its slot and levels it out on the way. The slot
 * stays hidden until the band lands.
 */
const dropAnimation: DropAnimation = {
  sideEffects: (params) => {
    const cleanup = defaultDropAnimationSideEffects({
      styles: { active: { opacity: '0' } }
    })(params);
    params.dragOverlay.node.firstElementChild?.animate(
      [{ rotate: DRAG_TILT }, { rotate: '0deg' }],
      { duration: 250, easing: 'ease', fill: 'forwards' }
    );
    return cleanup;
  }
};

interface SortableBandChipProps {
  /** Band reference as stored in the scene (name, raw name or common name) */
  reference: string;
  band: BandVariable;
  onRemove: () => void;
}

/**
 * Selected band that can be reordered. While it is dragged, it leaves a
 * dashed slot where it will drop.
 */
function SortableBandChip({
  reference,
  band,
  onRemove
}: SortableBandChipProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: reference });

  return (
    <Box
      ref={setNodeRef}
      flex={1}
      minW={0}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...listeners}
    >
      {isDragging ? (
        <Box
          h={10}
          borderWidth='1px'
          borderStyle='dashed'
          borderColor='border.emphasized'
          borderRadius='uni'
          bg='bg.subtle'
        />
      ) : (
        <BandChip
          reference={reference}
          band={band}
          onRemove={onRemove}
          handleRef={setActivatorNodeRef}
          handleProps={attributes}
        />
      )}
    </Box>
  );
}

interface BandChipProps {
  reference: string;
  band: BandVariable;
  onRemove?: () => void;
  /** Ref and accessibility props for the drag handle */
  handleRef?: (element: HTMLElement | null) => void;
  handleProps?: React.HTMLAttributes<HTMLElement>;
  /** Renders the chip that follows the pointer while dragging */
  isOverlay?: boolean;
}

function BandChip({
  reference,
  band,
  onRemove,
  handleRef,
  handleProps,
  isOverlay
}: BandChipProps) {
  return (
    <Flex
      h={10}
      align='center'
      bg='bg'
      borderWidth='1px'
      borderColor='border'
      borderRadius='uni'
      overflow='hidden'
      cursor={isOverlay ? 'grabbing' : 'grab'}
      boxShadow={isOverlay ? 'lg' : undefined}
      style={isOverlay ? { rotate: DRAG_TILT } : undefined}
    >
      <Flex
        ref={handleRef}
        {...handleProps}
        aria-label={`Reorder band ${reference}`}
        align='center'
        justify='center'
        alignSelf='stretch'
        px={1}
        bg='bg.muted'
        color='fg.subtle'
        flexShrink={0}
        focusVisibleRing='inside'
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
        tabIndex={isOverlay ? -1 : undefined}
        mr={1}
        p={1}
        minW={7}
        w='auto'
        h={7}
      >
        <LuX />
      </IconButton>
    </Flex>
  );
}
