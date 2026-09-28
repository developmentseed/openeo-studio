import { Box, SimpleGrid, Stack } from '@chakra-ui/react';

import { SAMPLE_SCENES } from '$config/sample-scenes';
import { ProjectsHeader } from './header';
import { SceneCard } from './scene-card';
import { BlankCard } from './blank-card';

export function ProjectsSamplesPage() {
  return (
    <Box flex={1}>
      <Stack gap={4}>
        <ProjectsHeader />
        <Box p={4}>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
            {SAMPLE_SCENES.map((scene) => (
              <SceneCard key={scene.id} scene={scene} />
            ))}
            <BlankCard />
          </SimpleGrid>
        </Box>
      </Stack>
    </Box>
  );
}
