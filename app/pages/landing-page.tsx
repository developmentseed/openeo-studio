import { useState } from 'react';
import { Box, Button, Flex, Heading, Text } from '@chakra-ui/react';
import { useAuth } from 'react-oidc-context';
import { useNavigate } from 'react-router';
import { SceneGrid } from '$components/landing/scene-grid';
import { DataConfigDialog } from '$components/setup/data-config-dialog';
import { APP_TITLE } from '$config/constants';
import { useSceneValues } from '../stores/scene/selectors';
import { BLANK_SCENE_ID, getSceneById } from '$config/sample-scenes';

export function LandingPage() {
  const { isAuthenticated, isLoading, signinRedirect } = useAuth();
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const [, setSceneValues] = useSceneValues();
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

    const blankScene = getSceneById(BLANK_SCENE_ID)!;

    setSceneValues({
      collectionId: config.collectionId,
      temporalRange: config.temporalRange,
      cloudCover: config.cloudCover,
      selectedBands: blankScene.defaultBands
    });
    navigate(`/editor/${BLANK_SCENE_ID}`);
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

        {isAuthenticated && (
          <SceneGrid onBlankSceneClick={handleBlankSceneClick} />
        )}

        {!isAuthenticated && !isLoading && (
          <Flex flexFlow='column' alignItems='start' gap={4}>
            <Text fontSize='md' color='orange.600' fontWeight='medium'>
              You need an account to use {APP_TITLE}. Please log in to continue.
            </Text>
            <Button
              variant='solid'
              colorPalette='primary'
              onClick={() => signinRedirect()}
            >
              Login
            </Button>
          </Flex>
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
