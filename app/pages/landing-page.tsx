import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import { SceneGrid } from '$components/landing/scene-grid';
import { APP_TITLE } from '$config/constants';

interface LandingPageProps {
  onSelectScene: (sceneId: string) => void;
}

export function LandingPage({ onSelectScene }: LandingPageProps) {
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

        <SceneGrid onSelectScene={onSelectScene} />
      </Flex>
    </Box>
  );
}
