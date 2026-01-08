import { useState } from 'react';
import { Flex } from '@chakra-ui/react';
import { AppHeader } from '$components/layout/app-header';
import { LandingPage } from '$pages/landing-page';
import { EditorPage } from '$pages/editor-page';
import { getSceneById } from './config/sample-scenes';
import type { SampleScene } from '$types';

export default function App() {
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [selectedScene, setSelectedScene] = useState<SampleScene | null>(null);

  // Handle scene selection from sample scenes
  const handleSelectScene = (sceneId: string) => {
    const scene = getSceneById(sceneId);
    if (scene) {
      setSelectedScene(scene);
      setSelectedSceneId(sceneId);
    }
  };

  // Reset to landing page
  const handleBack = () => {
    setSelectedSceneId(null);
    setSelectedScene(null);
  };

  return (
    <Flex flexDirection='column' height='100vh'>
      <AppHeader />
      {!selectedSceneId || !selectedScene ? (
        <LandingPage onSelectScene={handleSelectScene} />
      ) : (
        <EditorPage scene={selectedScene} onBack={handleBack} />
      )}
    </Flex>
  );
}
