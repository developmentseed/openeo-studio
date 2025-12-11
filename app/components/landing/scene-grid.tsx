import { SimpleGrid } from '@chakra-ui/react';
import { SAMPLE_SCENES } from '../../config/sample-scenes';
import { SceneCard } from './scene-card';

interface SceneGridProps {
  onSelectScene: (sceneId: string) => void;
}

export function SceneGrid({ onSelectScene }: SceneGridProps) {
  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
      {SAMPLE_SCENES.map((scene) => (
        <SceneCard key={scene.id} scene={scene} onSelect={onSelectScene} />
      ))}
    </SimpleGrid>
  );
}
