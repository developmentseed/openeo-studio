import { useState } from 'react';
import {
  HStack,
  InputGroup,
  NumberInput,
  Slider,
  Switch,
  Text,
  VStack
} from '@chakra-ui/react';

import { DEFAULT_EDITOR_CONFIG } from '$config/default-editor-config';
import type { QueryableStatus } from '$utils/openeo/queryables';

const DEFAULT_CLOUD_COVER = DEFAULT_EDITOR_CONFIG.cloudCover ?? 50;

interface CloudCoverSliderProps {
  /** Max cloud cover; `undefined` means no cloud cover filter. */
  cloudCover: number | undefined;
  /** Whether the collection can be filtered on `eo:cloud_cover`. */
  queryable: QueryableStatus;
  onCloudCoverChange: (cloudCover: number | undefined) => void;
}

export function CloudCoverSlider({
  cloudCover,
  queryable,
  onCloudCoverChange
}: CloudCoverSliderProps) {
  // Value to restore when the filter is switched on again.
  const [lastCloudCover, setLastCloudCover] = useState(
    cloudCover ?? DEFAULT_CLOUD_COVER
  );

  if (queryable === 'unsupported') {
    return (
      <Text fontSize='sm' color='fg.muted'>
        This collection has no cloud cover property. No cloud cover filter is
        applied.
      </Text>
    );
  }

  const isEnabled = cloudCover !== undefined;
  const value = cloudCover ?? lastCloudCover;

  const handleChange = (next: number) => {
    setLastCloudCover(next);
    onCloudCoverChange(next);
  };

  return (
    <VStack align='stretch' gap={3}>
      <Switch.Root
        size='sm'
        checked={isEnabled}
        onCheckedChange={(details) =>
          onCloudCoverChange(details.checked ? lastCloudCover : undefined)
        }
      >
        <Switch.HiddenInput />
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        <Switch.Label>Filter by cloud cover</Switch.Label>
      </Switch.Root>
      <HStack gap={6} width='full' align='center'>
        <Slider.Root
          flex={1}
          value={[value]}
          onValueChange={(details) => handleChange(details.value[0])}
          min={0}
          max={100}
          step={5}
          variant='solid'
          disabled={!isEnabled}
        >
          <Slider.Label>Cloud coverage</Slider.Label>
          <Slider.Control>
            <Slider.Track>
              <Slider.Range />
            </Slider.Track>
            <Slider.Thumb index={0} />
          </Slider.Control>
        </Slider.Root>
        <NumberInput.Root
          id='cloud-cover'
          size='sm'
          width='7.5rem'
          flexShrink={0}
          min={0}
          max={100}
          clampValueOnBlur
          disabled={!isEnabled}
          value={String(value)}
          onValueChange={(details) => {
            if (!isNaN(details.valueAsNumber)) {
              handleChange(Math.min(100, Math.max(0, details.valueAsNumber)));
            }
          }}
        >
          <InputGroup endAddon='%'>
            <NumberInput.Input aria-label='Cloud coverage percentage' />
          </InputGroup>
        </NumberInput.Root>
      </HStack>
    </VStack>
  );
}
