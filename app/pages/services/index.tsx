import { Box, Flex, Heading, SimpleGrid, Stack } from '@chakra-ui/react';
import { LuServer, LuServerOff } from 'react-icons/lu';

import { EmptyState } from '$components/common/empty-state';
import { InfoPopoverButton } from '$components/common/info-popover-button';
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
          <Flex gap={1} alignItems='center'>
            <Heading size='md'>Permanent Services</Heading>
            <InfoPopoverButton
              storageKey='services'
              label='About permanent services'
            >
              Permanent services are the result of openEO processes published
              from a map layer in the editor.
            </InfoPopoverButton>
          </Flex>
        </Flex>
        <Flex px={2} h='100%' justifyContent='stretch'>
          {error ? (
            <Flex w='100%' align='center' justify='center'>
              <EmptyState
                variant='error'
                icon={<LuServerOff size='4rem' />}
                title='Error loading services'
                description={error.message}
              />
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
              <EmptyState
                icon={<LuServer size='4rem' />}
                title='No permanent services'
                description='Use the export button on a map layer to create one.'
              />
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
