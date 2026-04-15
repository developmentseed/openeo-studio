import { Box, Flex, IconButton, Switch, Text, VStack } from '@chakra-ui/react';
import type { ServiceInfo } from '$types';

function ShareIcon() {
  return (
    <svg viewBox='0 0 16 16' width='14' height='14' fill='currentColor'>
      <path d='M13.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.5 2.5 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5zm-8.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm11 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z' />
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
                aria-label='Share as permanent service'
                size='xs'
                variant='ghost'
                onClick={() => onShareService(service)}
              >
                <ShareIcon />
              </IconButton>
            )}
          </Flex>
        ))}
      </VStack>
    </Box>
  );
}
