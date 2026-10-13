import { HStack, InputGroup, NumberInput, Slider } from '@chakra-ui/react';

interface CloudCoverSliderProps {
  cloudCover: number;
  onCloudCoverChange: (cloudCover: number) => void;
}

export function CloudCoverSlider({
  cloudCover,
  onCloudCoverChange
}: CloudCoverSliderProps) {
  return (
    <HStack gap={6} width='full' align='center'>
      <Slider.Root
        flex={1}
        value={[cloudCover]}
        onValueChange={(details) => onCloudCoverChange(details.value[0])}
        min={0}
        max={100}
        step={5}
        variant='solid'
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
        value={String(cloudCover)}
        onValueChange={(details) => {
          if (!isNaN(details.valueAsNumber)) {
            onCloudCoverChange(
              Math.min(100, Math.max(0, details.valueAsNumber))
            );
          }
        }}
      >
        <InputGroup endAddon='%'>
          <NumberInput.Input aria-label='Cloud coverage percentage' />
        </InputGroup>
      </NumberInput.Root>
    </HStack>
  );
}
