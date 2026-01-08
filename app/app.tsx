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

  // Handle direct collection selection - create temporary scene
  const handleSelectCollection = (collectionId: string) => {
    const temporaryScene: SampleScene = {
      id: `collection-${collectionId}`,
      name: `Explore ${collectionId}`,
      description: `Direct exploration of the ${collectionId} collection`,
      collectionId,
      suggestedAlgorithm: '', // Will default to basic true color or first available
      defaultBands: [], // Will be populated from collection metadata
      temporalRange: ['2023-01-01', '2023-12-31'], // Default temporal range
      parameterDefaults: {
        boundingBox: { west: -180, south: -90, east: 180, north: 90 }, // Global extent as default
        cloudCover: 50
      }
    };
    setSelectedScene(temporaryScene);
    setSelectedSceneId(`collection-${collectionId}`);
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
        <LandingPage
          onSelectScene={handleSelectScene}
          onSelectCollection={handleSelectCollection}
        />
      ) : (
        <EditorPage scene={selectedScene} onBack={handleBack} />
      )}
    </Flex>
  );
}
