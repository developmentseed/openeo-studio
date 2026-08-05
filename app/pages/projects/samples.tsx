import { Box, Stack } from '@chakra-ui/react';
import { ProjectsNav } from './navigation';
import { SceneGrid } from '$components/landing/scene-grid';

export function ProjectsSamplesPage() {
  return (
    <Box flex={1}>
      <Stack gap={4}>
        <ProjectsNav />
        <Box p={4}>
          <SceneGrid />
        </Box>
      </Stack>
    </Box>
  );
}
