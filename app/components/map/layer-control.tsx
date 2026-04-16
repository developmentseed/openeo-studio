import { Box, Flex, IconButton, Switch, Text, VStack } from '@chakra-ui/react';
import type { ServiceInfo } from '$types';

function SaveIcon() {
  return (
    <svg viewBox='0 0 16 16' width='14' height='14' fill='currentColor'>
      <path d='M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z' />
      <path d='M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z' />
    </svg>
  );
}

interface LayerControlProps {
  services: ServiceInfo[];
  onToggleLayer: (serviceId: string) => void;
  onShareService?: (service: ServiceInfo) => void;
}

export function LayerControl({
  services,
  onToggleLayer,
  onShareService
}: LayerControlProps) {
  if (services.length === 0) {
    return null;
  }

  return (
    <Box
      position='absolute'
      top={4}
      right={4}
      bg='bg'
      borderRadius='sm'
      p={3}
      minW={52}
      zIndex={1000}
    >
      <Text fontSize='sm' fontWeight='medium' mb={2}>
        Map Layers
      </Text>
      <VStack align='stretch' gap={1}>
        {services.map((service) => (
          <Flex
            key={service.id}
            align='center'
            justify='space-between'
            py={1}
            px={2}
            borderRadius='sm'
          >
            <Text
              fontSize='sm'
              color={service.visible ? 'black' : 'gray.400'}
              lineClamp='1'
              flex={1}
            >
              {service.graphResult.name}
            </Text>
            <Switch.Root
              size='sm'
              checked={service.visible}
              onCheckedChange={() => onToggleLayer(service.id)}
            >
              <Switch.HiddenInput />
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Root>
            {onShareService && (
              <IconButton
                aria-label='Save as permanent service'
                size='xs'
                variant='ghost'
                onClick={() => onShareService(service)}
              >
                <SaveIcon />
              </IconButton>
            )}
          </Flex>
        ))}
      </VStack>
    </Box>
  );
}
