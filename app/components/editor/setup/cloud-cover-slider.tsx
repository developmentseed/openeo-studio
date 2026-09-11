import { HStack, Text, Box, Field, Slider } from '@chakra-ui/react';

interface CloudCoverSliderProps {
  cloudCover: number;
  onCloudCoverChange: (cloudCover: number) => void;
}

export function CloudCoverSlider({
  cloudCover,
  onCloudCoverChange
}: CloudCoverSliderProps) {
  return (
    <Field.Root>
      <Field.Label htmlFor='cloud-cover'>Maximum Cloud Cover</Field.Label>
      <HStack gap={4} width='full'>
        <Box flex={1} maxWidth='300px'>
          <Slider.Root
            value={[cloudCover]}
            onValueChange={(details) => onCloudCoverChange(details.value[0])}
            min={0}
            max={100}
            step={5}
          >
            <Slider.Control>
              <Slider.Track>
                <Slider.Range />
              </Slider.Track>
              <Slider.Thumb index={0} />
            </Slider.Control>
          </Slider.Root>
        </Box>
        <Text fontSize='sm' fontWeight='medium' minWidth='45px'>
          {cloudCover}%
        </Text>
      </HStack>
      <Field.HelperText>
        Filter scenes by cloud cover percentage
      </Field.HelperText>
    </Field.Root>
  );
}
