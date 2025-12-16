import { useState } from 'react';
import { Flex, Box, Text } from '@chakra-ui/react';
import type { BandVariable } from '$utils/stac-band-parser';

interface BandInfoProps {
  bands: BandVariable[];
}

/**
 * Display available band variables for users to reference in their Python code.
 * Shows variable names, labels, and metadata in a compact chip format.
 * Click to see details, drag to insert variable into editor.
 */
export function BandInfo({ bands }: BandInfoProps) {
  const [expandedBands, setExpandedBands] = useState<Set<string>>(new Set());

  if (bands.length === 0) {
    return null;
  }

  const toggleBand = (variable: string) => {
    setExpandedBands((prev) => {
      const next = new Set(prev);
      if (next.has(variable)) {
        next.delete(variable);
      } else {
        next.add(variable);
      }
      return next;
    });
  };

  return (
    <Flex
      gap={2}
      p={2}
      wrap='wrap'
      borderWidth='2px'
      borderColor='gray.300'
      layerStyle='handDrawn'
    >
      <Text
        fontSize='xs'
        fontWeight='semibold'
        color='gray.600'
        alignSelf='center'
      >
        Available bands:
      </Text>
      {bands.map((band) => (
        <BandChip
          key={band.variable}
          band={band}
          isExpanded={expandedBands.has(band.variable)}
          onToggle={() => toggleBand(band.variable)}
        />
      ))}
    </Flex>
  );
}

interface BandChipProps {
  band: BandVariable;
  isExpanded: boolean;
  onToggle: () => void;
}

function BandChip({ band, isExpanded, onToggle }: BandChipProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', band.variable);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <Box
      as='button'
      draggable
      onDragStart={handleDragStart}
      px={2}
      py={1}
      bg={isExpanded ? 'blue.50' : 'white'}
      borderRadius='md'
      borderWidth='2px'
      borderColor={isExpanded ? 'blue.500' : 'gray.300'}
      layerStyle='handDrawn'
      fontSize='sm'
      cursor='grab'
      transition='all 0.2s'
      onClick={onToggle}
      _hover={{ bg: isExpanded ? 'blue.100' : 'gray.50', scale: 1.05 }}
      _focus={{
        outline: 'none',
        borderColor: 'blue.500',
        boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.2)'
      }}
      _active={{ cursor: 'grabbing' }}
      aria-label={`${band.variable} - ${band.label}. Click to see details, drag to insert into editor.`}
      aria-pressed={isExpanded}
      title='Click for details, drag to insert'
    >
      <Flex gap={1.5} alignItems='center'>
        {/* Variable name (always visible) */}
        <Text fontFamily='monospace' fontWeight='bold' color='blue.600'>
          {band.variable}
        </Text>

        {/* Expanded details (when selected) */}
        {isExpanded && (
          <>
            <Text color='gray.700' fontWeight='medium'>
              {band.label}
            </Text>
            {band.resolution && (
              <Text fontSize='xs' color='gray.500'>
                {band.resolution}
              </Text>
            )}
            {band.wavelength && (
              <Text fontSize='xs' color='gray.500'>
                {band.wavelength}
              </Text>
            )}
          </>
        )}
      </Flex>
    </Box>
  );
}
