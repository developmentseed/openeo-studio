import { SimpleGrid } from '@chakra-ui/react';

import { SAMPLE_SCENES } from '../../config/sample-scenes';
import { SceneCard } from './scene-card';
import { BlankCard } from './blank-card';

interface SceneGridProps {
  onBlankSceneClick: () => void;
}

export function SceneGrid({ onBlankSceneClick }: SceneGridProps) {
  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
      {SAMPLE_SCENES.map((scene) => (
        <SceneCard key={scene.id} scene={scene} />
      ))}
      <BlankCard onSelect={onBlankSceneClick} />
    </SimpleGrid>
  );
}
