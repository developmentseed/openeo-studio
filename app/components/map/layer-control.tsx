import { Box, Flex, Switch, Text, VStack } from '@chakra-ui/react';
import type { ServiceInfo } from '$types';

interface LayerControlProps {
  services: ServiceInfo[];
  onToggleLayer: (serviceId: string) => void;
}

export function LayerControl({ services, onToggleLayer }: LayerControlProps) {
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
          </Flex>
        ))}
      </VStack>
    </Box>
  );
}
