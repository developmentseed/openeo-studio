import { useState } from 'react';
import { Flex } from '@chakra-ui/react';
import { AppHeader } from '$components/layout/app-header';
import { LandingPage } from '$pages/landing-page';
import { EditorPage } from '$pages/editor-page';
import { getSceneById } from './config/sample-scenes';

export default function App() {
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);

  // Get the selected scene data
  const scene = selectedSceneId ? getSceneById(selectedSceneId) : null;

  // If scene not found but ID is set, reset
  if (selectedSceneId && !scene) {
    setSelectedSceneId(null);
  }

  return (
    <Flex flexDirection='column' height='100vh'>
      <AppHeader />
      {!selectedSceneId ? (
        <LandingPage onSelectScene={setSelectedSceneId} />
      ) : scene ? (
        <EditorPage scene={scene} onBack={() => setSelectedSceneId(null)} />
      ) : null}
    </Flex>
  );
}
