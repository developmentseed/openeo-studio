import { Box, Flex, IconButton, Text, VStack } from '@chakra-ui/react';
import type { ServiceInfo } from '../../utils/template-renderer';

interface LayerControlProps {
  services: ServiceInfo[];
  onToggleLayer: (serviceId: string) => void;
}

function EyeIcon() {
  return (
    <svg width='16' height='16' viewBox='0 0 16 16' fill='currentColor'>
      <path d='M8,2C2,2 0,8 0,8C0,8 2,14 8,14C14,14 16,8 16,8C16,8 14,2 8,2ZM8,12C4.519,12 2.787,9.272 2.168,8C2.481,7.358 3.082,6.34 4.051,5.491C4.03,5.66 4,5.826 4,6C4,8.209 5.791,10 8,10C10.209,10 12,8.209 12,6C12,5.825 11.97,5.658 11.949,5.49C12.917,6.338 13.519,7.356 13.832,8C13.214,9.267 11.479,12 8,12Z' />
    </svg>
  );
}

function EyeClosedIcon() {
  return (
    <svg width='16' height='16' viewBox='0 0 16 16' fill='currentColor'>
      <path d='M13.359,11.238C15.06,9.72 16,8 16,8C16,8 14,2 8,2C7.364,2 6.747,2.098 6.162,2.274L13.359,11.238Z' />
      <path d='M0.702,2.095L2.274,6.162L4.697,9.274L6.274,11.238L8,13.905L9.726,11.238L13.905,7.726L15.298,13.905L14,15L8,9L2,3L0.702,2.095Z' />
    </svg>
  );
}

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
      bg='white'
      borderRadius='md'
      boxShadow='lg'
      p={3}
      minW='200px'
      zIndex={1000}
    >
      <Text fontSize='sm' fontWeight='bold' mb={2}>
        Map Layers
      </Text>
      <VStack align='stretch' spacing={1}>
        {services.map((service) => (
          <Flex
            key={service.id}
            align='center'
            justify='space-between'
            py={1}
            px={2}
            borderRadius='sm'
            _hover={{ bg: 'gray.50' }}
          >
            <Text
              fontSize='sm'
              color={service.visible ? 'black' : 'gray.400'}
              noOfLines={1}
              flex={1}
            >
              {service.graphResult.name}
            </Text>
            <IconButton
              size='xs'
              variant='ghost'
              aria-label={service.visible ? 'Hide layer' : 'Show layer'}
              onClick={() => onToggleLayer(service.id)}
              color={service.visible ? 'blue.500' : 'gray.400'}
            >
              {service.visible ? <EyeIcon /> : <EyeClosedIcon />}
            </IconButton>
          </Flex>
        ))}
      </VStack>
    </Box>
  );
}
