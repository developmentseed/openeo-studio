import { Box, Stack } from '@chakra-ui/react';
import { SceneGrid } from '$components/landing/scene-grid';
import { ProjectsHeader } from './header';

export function ProjectsSamplesPage() {
  return (
    <Box flex={1}>
      <Stack gap={4}>
        <ProjectsHeader />
        <Box p={4}>
          <SceneGrid />
        </Box>
      </Stack>
    </Box>
  );
}
