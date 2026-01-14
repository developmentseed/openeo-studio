import { SimpleGrid } from '@chakra-ui/react';
import { useAuth } from 'react-oidc-context';

import { SAMPLE_SCENES } from '../../config/sample-scenes';
import { SceneCard } from './scene-card';
import { BlankCard } from './blank-card';

interface SceneGridProps {
  onSelectScene: (sceneId: string) => void;
  onBlankSceneClick: () => void;
}

export function SceneGrid({
  onSelectScene,
  onBlankSceneClick
}: SceneGridProps) {
  const { isAuthenticated } = useAuth();
  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
      {SAMPLE_SCENES.map((scene) => (
        <SceneCard key={scene.id} scene={scene} onSelect={onSelectScene} />
      ))}
      {isAuthenticated && <BlankCard onSelect={onBlankSceneClick} />}
    </SimpleGrid>
  );
}
