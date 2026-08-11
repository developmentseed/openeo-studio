import {
  Box,
  Flex,
  Heading,
  SimpleGrid,
  Stack,
  Text,
  VStack
} from '@chakra-ui/react';
import { LuServer, LuServerOff } from 'react-icons/lu';

import { ServiceCard } from '$components/services/service-card';
import { ServiceCardSkeleton } from '$components/services/service-card-skeleton';
import { useServices } from '$stores/services-store';

const SKELETON_COUNT = 6;

export function ServicesPage() {
  const { services, isLoading, error } = useServices();

  return (
    <Box flex={1}>
      <Stack h='100%' gap={4}>
        <Flex
          gap={4}
          justifyContent='space-between'
          alignItems='center'
          px={2}
          py={4}
        >
          <Heading size='md'>Permanent Services</Heading>
        </Flex>
        <Flex px={2} h='100%' justifyContent='stretch'>
          {error ? (
            <Flex w='100%' align='center' justify='center'>
              <ErrorServices error={error} />
            </Flex>
          ) : isLoading ? (
            <SimpleGrid
              columns={{ base: 1, md: 2, lg: 3 }}
              gap={4}
              alignSelf='start'
              width='100%'
            >
              {Array.from({ length: SKELETON_COUNT }, (_, index) => (
                <ServiceCardSkeleton key={index} />
              ))}
            </SimpleGrid>
          ) : services.length === 0 ? (
            <Flex w='100%' align='center' justify='center'>
              <NoServices />
            </Flex>
          ) : (
            <SimpleGrid
              columns={{ base: 1, md: 2, lg: 3 }}
              gap={4}
              alignSelf='start'
              width='100%'
            >
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </SimpleGrid>
          )}
        </Flex>
      </Stack>
    </Box>
  );
}

function NoServices() {
  return (
    <Box
      borderWidth='2px'
      borderStyle='dashed'
      borderColor='border'
      borderRadius='lg'
      bg='bg'
      p={6}
      boxSize='100%'
      maxH='40rem'
      maxW='80rem'
    >
      <VStack gap={2} justify='center' height='100%'>
        <LuServer size='4rem' />
        <VStack gap={2}>
          <Text fontWeight='semibold' fontSize='lg'>
            No permanent services
          </Text>
          <Text fontSize='sm' textAlign='center'>
            Use the export button on a map layer to create one.
          </Text>
        </VStack>
      </VStack>
    </Box>
  );
}

function ErrorServices({ error }: { error: Error }) {
  return (
    <Box
      borderWidth='2px'
      borderStyle='dashed'
      borderColor='border.error'
      borderRadius='lg'
      bg='white'
      p={6}
      boxSize='100%'
      maxH='40rem'
      maxW='80rem'
    >
      <VStack gap={2} justify='center' height='100%'>
        <LuServerOff size='4rem' />
        <VStack gap={2} color='error.700'>
          <Text fontWeight='semibold' fontSize='lg'>
            Error loading services
          </Text>
          <Text fontSize='sm' textAlign='center'>
            {error.message}
          </Text>
        </VStack>
      </VStack>
    </Box>
  );
}
