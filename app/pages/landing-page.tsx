import { Box, Flex, Heading, Text, VStack } from '@chakra-ui/react';
import { SceneGrid } from '$components/landing/scene-grid';
import { APP_TITLE } from '$config/constants';

interface LandingPageProps {
  onSelectScene: (sceneId: string) => void;
}

export function LandingPage({ onSelectScene }: LandingPageProps) {
  return (
    <Box flex={1} overflowY='auto' px={8} py={8}>
      <Flex flexDirection='column' maxWidth='1200px' mx='auto' gap={8}>
        <VStack gap={2} textAlign='center'>
          <Heading size='2xl'>Welcome to {APP_TITLE}</Heading>
          <Text fontSize='lg' color='gray.600' maxW='600px'>
            Explore satellite imagery with curated sample scenes
          </Text>
        </VStack>

        <VStack gap={4} align='stretch'>
          <Text fontSize='md' color='gray.600' textAlign='center'>
            Get started quickly with pre-configured sample scenarios
          </Text>
          <SceneGrid onSelectScene={onSelectScene} />
        </VStack>
      </Flex>
    </Box>
  );
}
