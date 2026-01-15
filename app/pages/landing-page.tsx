import { useState } from 'react';
import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import { useAuth } from 'react-oidc-context';
import { useNavigate } from 'react-router';
import { SceneGrid } from '$components/landing/scene-grid';
import { DataConfigDialog } from '$components/setup/data-config-dialog';
import { APP_TITLE } from '$config/constants';
import { BLANK_SCENE_ID } from '$config/sample-scenes';

export function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const navigate = useNavigate();

  const handleBlankSceneClick = () => {
    setIsConfigOpen(true);
  };

  const handleConfigApply = (config: {
    collectionId: string;
    temporalRange: [string, string];
    cloudCover: number;
  }) => {
    setIsConfigOpen(false);
    // Navigate to editor with blank scene config in location state
    navigate(`/editor/${BLANK_SCENE_ID}`, { state: config });
  };

  const handleConfigCancel = () => {
    setIsConfigOpen(false);
  };

  return (
    <Box flex={1} overflowY='auto' px={8} py={8}>
      <Flex flexDirection='column' maxWidth='1200px' mx='auto' gap={6}>
        <Flex flexDirection='column' gap={2}>
          <Heading size='2xl'>Welcome to {APP_TITLE}</Heading>

          <Text fontSize='lg' color='gray.600'>
            Select a sample scene to start exploring and processing satellite
            imagery
          </Text>
        </Flex>

        <SceneGrid onBlankSceneClick={handleBlankSceneClick} />

        {!isAuthenticated && !isLoading && (
          <Text fontSize='md' color='orange.600' fontWeight='medium'>
            You need an account to use {APP_TITLE}. Please log in using the
            button in the top-right corner.
          </Text>
        )}
      </Flex>

      <DataConfigDialog
        open={isConfigOpen}
        onOpenChange={(e) => {
          if (!e.open) {
            handleConfigCancel();
          }
        }}
        collectionId=''
        temporalRange={['', '']}
        cloudCover={20}
        onApply={handleConfigApply}
      />
    </Box>
  );
}
