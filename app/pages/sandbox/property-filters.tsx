import { useState } from 'react';
import { Box, Code, Flex, Heading, Text } from '@chakra-ui/react';

import { PropertyFilters } from '$components/editor/setup/property-filters';
import { resolveQueryables } from '$utils/openeo/queryables';
import type { PropertyFilter } from '$types';

import { SENTINEL_2_QUERYABLES } from './sentinel-2-queryables';

const QUERYABLES = resolveQueryables(
  {
    ...SENTINEL_2_QUERYABLES,
    // Not in the MPC response: covers the boolean kind.
    'pl:ground_control': { type: 'boolean', title: 'Ground control' }
  },
  []
);

/**
 * Dev-only sandbox for the property filters selector, on static Sentinel-2
 * queryables. Registered from `app.tsx` only when `import.meta.env.DEV` is
 * true.
 */
export function PropertyFiltersSandboxPage() {
  const [filters, setFilters] = useState<PropertyFilter[]>([
    { property: 'eo:cloud_cover', operator: 'lte', value: 20 }
  ]);

  return (
    <Box
      flex={1}
      display='flex'
      flexDirection='column'
      minH={0}
      bg='bg.panel'
      borderRadius='uni'
      overflow='hidden'
    >
      <Box
        px={4}
        py={2}
        borderBottomWidth='1px'
        borderColor='border'
        flexShrink={0}
      >
        <Heading size='sm'>Property filters sandbox</Heading>
        <Text fontSize='xs' color='fg.muted'>
          Sentinel-2 L2A queryables from openeo.mpc.ds.io
        </Text>
      </Box>
      <Flex flex={1} minH={0} gap={6} p={4} overflow='auto'>
        <Box width='26rem' flexShrink={0}>
          <PropertyFilters
            queryables={QUERYABLES}
            filters={filters}
            onChange={setFilters}
          />
        </Box>
        <Code
          as='pre'
          flex={1}
          alignSelf='start'
          p={3}
          fontSize='xs'
          whiteSpace='pre-wrap'
        >
          {JSON.stringify(filters, null, 2)}
        </Code>
      </Flex>
    </Box>
  );
}
