import { Box, Stack } from '@chakra-ui/react';
import { ProjectsNav } from './navigation';

export function ProjectsPage() {
  return (
    <Box flex={1}>
      <Stack gap={4}>
        <ProjectsNav />
      </Stack>
    </Box>
  );
}
