import { Box, IconButton, Popover, VStack, RadioGroup } from '@chakra-ui/react';

interface BaseLayerOption {
  id: string;
  label: string;
  styleUrl: string;
}

interface BaseLayerControlProps {
  options: BaseLayerOption[];
  value: string;
  onChange: (id: string) => void;
}

function MapIcon() {
  return (
    <svg
      version='1.1'
      xmlns='http://www.w3.org/2000/svg'
      width='16'
      height='16'
      viewBox='0 0 16 16'
    >
      <rect width='16' height='16' id='icon-bound' fill='none' />
      <path d='M8,9L0,5l8-4l8,4L8,9z M14.397,7.2L16,8l-8,4L0,8l1.603-0.8L8,10.397L14.397,7.2z M14.397,10.2L16,11l-8,4l-8-4l1.603-0.8 L8,13.397L14.397,10.2z' />
    </svg>
  );
}

export function BaseLayerControl({
  options,
  value,
  onChange
}: BaseLayerControlProps) {
  if (options.length === 0) {
    return null;
  }

  return (
    <Box position='absolute' top={4} left={4} zIndex={1000}>
      <Popover.Root positioning={{ placement: 'left-start' }} size='xs'>
        <Popover.Trigger asChild>
          <IconButton size='sm' aria-label='Select base map' bgColor='bg'>
            <MapIcon />
          </IconButton>
        </Popover.Trigger>
        <Popover.Positioner>
          <Popover.Content>
            <Popover.Body>
              <Popover.Title fontWeight='medium' mb={2}>
                Base map
              </Popover.Title>
              <RadioGroup.Root
                value={value}
                onValueChange={(details) => {
                  if (details.value) onChange(details.value);
                }}
              >
                <VStack align='stretch' gap={2}>
                  {options.map((option) => (
                    <RadioGroup.Item key={option.id} value={option.id}>
                      <RadioGroup.ItemHiddenInput />
                      <RadioGroup.ItemIndicator />
                      <RadioGroup.ItemText>{option.label}</RadioGroup.ItemText>
                    </RadioGroup.Item>
                  ))}
                </VStack>
              </RadioGroup.Root>
            </Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Popover.Root>
    </Box>
  );
}
