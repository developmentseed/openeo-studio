import { SimpleGrid } from '@chakra-ui/react';
import { BLANK_SCENE_ID, SAMPLE_SCENES } from '../../config/sample-scenes';
import { SceneCard } from './scene-card';
import { BlankCard } from './blank-card';

interface SceneGridProps {
  onSelectScene: (sceneId: string) => void;
}

export function SceneGrid({ onSelectScene }: SceneGridProps) {
  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
      {SAMPLE_SCENES.map((scene) => (
        <SceneCard key={scene.id} scene={scene} onSelect={onSelectScene} />
      ))}
      <BlankCard onSelect={() => onSelectScene(BLANK_SCENE_ID)} />
    </SimpleGrid>
  );
}
