import { Box, Heading, Text } from '@chakra-ui/react';

import { ProcessGraphViewer } from '$components/process-graph';

import { KITCHEN_SINK_GRAPH } from './kitchen-sink-graph';

/**
 * Dev-only kitchen sink for the process graph viewer. Registered from
 * `app.tsx` only when `import.meta.env.DEV` is true.
 */
export function VisualGraphSandboxPage() {
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
        <Heading size='sm'>Visual graph kitchen sink</Heading>
        <Text fontSize='xs' color='fg.muted'>
          All viewer argument kinds and nesting
        </Text>
      </Box>
      <Box flex={1} minH={0} display='flex'>
        <ProcessGraphViewer graph={KITCHEN_SINK_GRAPH} />
      </Box>
    </Box>
  );
}
