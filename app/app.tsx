import { useState } from 'react';
import { Flex } from '@chakra-ui/react';
import { AppHeader } from '$components/layout/app-header';
import { LandingPage } from '$pages/landing-page';
import { EditorPage } from '$pages/editor-page';
import { getSceneById, BLANK_SCENE_ID } from './config/sample-scenes';

export default function App() {
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [blankSceneConfig, setBlankSceneConfig] = useState<{
    collectionId: string;
    temporalRange: [string, string];
    cloudCover: number;
  } | null>(null);

  // Get the selected scene data
  let scene = selectedSceneId ? getSceneById(selectedSceneId) : null;

  // If it's a blank scene, override defaults with the configured values
  if (scene && scene.id === BLANK_SCENE_ID && blankSceneConfig) {
    scene = {
      ...scene,
      collectionId: blankSceneConfig.collectionId,
      temporalRange: blankSceneConfig.temporalRange,
      parameterDefaults: {
        ...(scene.parameterDefaults || {}),
        cloudCover: blankSceneConfig.cloudCover
      }
    };
  }

  // If scene not found but ID is set, reset
  if (selectedSceneId && !scene) {
    setSelectedSceneId(null);
  }

  const handleStartFromScratch = (config: {
    collectionId: string;
    temporalRange: [string, string];
    cloudCover: number;
  }) => {
    setBlankSceneConfig(config);
    setSelectedSceneId(BLANK_SCENE_ID);
  };

  return (
    <Flex flexDirection='column' height='100vh'>
      <AppHeader />
      {!selectedSceneId ? (
        <LandingPage
          onSelectScene={setSelectedSceneId}
          onStartFromScratch={handleStartFromScratch}
        />
      ) : scene ? (
        <EditorPage scene={scene} onBack={() => setSelectedSceneId(null)} />
      ) : null}
    </Flex>
  );
}
