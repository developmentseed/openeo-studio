import { Box, Flex, Heading, Text, Tabs, VStack } from '@chakra-ui/react';
import { SceneGrid } from '$components/landing/scene-grid';
import { CollectionBrowser } from '$components/landing/collection-browser';
import { APP_TITLE } from '$config/constants';

interface LandingPageProps {
  onSelectScene: (sceneId: string) => void;
  onSelectCollection: (collectionId: string) => void;
}

export function LandingPage({
  onSelectScene,
  onSelectCollection
}: LandingPageProps) {
  return (
    <Box flex={1} overflowY='auto' px={8} py={8}>
      <Flex flexDirection='column' maxWidth='1200px' mx='auto' gap={8}>
        <VStack gap={2} textAlign='center'>
          <Heading size='2xl'>Welcome to {APP_TITLE}</Heading>
          <Text fontSize='lg' color='gray.600' maxW='600px'>
            Explore satellite imagery with curated sample scenes or browse all
            available data collections
          </Text>
        </VStack>

        <Tabs.Root defaultValue='scenes' variant='enclosed' size='lg'>
          <Tabs.List>
            <Tabs.Trigger value='scenes'>Sample Scenes</Tabs.Trigger>
            <Tabs.Trigger value='collections'>All Collections</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value='scenes' pt={6}>
            <VStack gap={4} align='stretch'>
              <Text fontSize='md' color='gray.600'>
                Get started quickly with pre-configured sample scenarios
              </Text>
              <SceneGrid onSelectScene={onSelectScene} />
            </VStack>
          </Tabs.Content>

          <Tabs.Content value='collections' pt={6}>
            <CollectionBrowser onSelectCollection={onSelectCollection} />
          </Tabs.Content>
        </Tabs.Root>
      </Flex>
    </Box>
  );
}
