import { useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  SimpleGrid,
  Stack,
  Text
} from '@chakra-ui/react';
import { NavLink } from 'react-router';
import { LuArrowRight } from 'react-icons/lu';

import { APP_TITLE } from '$config/constants';
import { SAMPLE_SCENES } from '$config/sample-scenes';
import { useEditorStore } from '$stores/editor-store';
import { LoginButton } from '$components/auth/login-button';
import { SceneCard } from '$components/landing/scene-card';

export function LandingPage() {
  const { clearEditor } = useEditorStore();

  // Clear editor state when navigating to landing to ensure fresh scene loads
  useEffect(() => {
    clearEditor();
  }, [clearEditor]);

  return (
    <Box flex={1}>
      <Stack h='100%' gap={4}>
        <Flex
          gap={4}
          justifyContent='space-between'
          alignItems='center'
          px={2}
          py={4}
        >
          <Heading size='md'>Welcome to {APP_TITLE}</Heading>
          <Flex gap={2}>
            <LoginButton hideIfAuthenticated />
          </Flex>
        </Flex>
        <Stack p={4} gap={12}>
          <SimpleGrid columns={12} gap={8} maxW='56rem' mx='auto' w='100%'>
            <Stack
              gridColumn='1 / span 8'
              gap={4}
              align='start'
              justify='center'
            >
              <Heading size='2xl'>
                Author openEO python code and visualize its output from the
                comfort of your browser
              </Heading>
              <Text>
                Write and execute openEO python code directly in your browser to
                process cloud-native data. Visualize results instantly with
                on-the-fly rendering.
              </Text>

              <Button variant='outline' asChild>
                <NavLink to='/docs' end>
                  Learn More <LuArrowRight />
                </NavLink>
              </Button>
            </Stack>
            <Box bg='neutral.300' gridColumn='9 / span 4' aspectRatio={1} />
          </SimpleGrid>

          <SimpleGrid columns={12} gap={8} maxW='56rem' mx='auto' w='100%'>
            <Heading gridColumn='1 / -1' size='2xl'>
              Features
            </Heading>

            <Box bg='neutral.300' gridColumn='1 / span 5' aspectRatio={1} />
            <Stack
              gridColumn='6 / span 7'
              gap={4}
              align='start'
              justify='center'
            >
              <Heading as='h3'>Feature Lorem Ipsum</Heading>
              <Text>Some description about this</Text>
            </Stack>

            <Stack
              gridColumn='1 / span 7'
              gap={4}
              align='start'
              justify='center'
            >
              <Heading as='h3'>Feature Lorem Ipsum</Heading>
              <Text>Some description about this</Text>
            </Stack>
            <Box bg='neutral.300' gridColumn='8 / span 5' aspectRatio={1} />
          </SimpleGrid>

          <SimpleGrid columns={12} gap={8} maxW='56rem' mx='auto' w='100%'>
            <Heading gridColumn='1 / -1' size='2xl'>
              Algorithm catalog
            </Heading>

            <Stack
              gridColumn='1 / span 7'
              gap={4}
              align='start'
              justify='center'
            >
              <Heading as='h3'>Access an extensive algorithm catalog</Heading>
              <Text>
                These are some of the sample scenes you&apos;ll have access to
                once you create an account and login
              </Text>

              <LoginButton size='md' hideIfAuthenticated />
            </Stack>

            <SceneCard scene={SAMPLE_SCENES[0]} gridColumn='8 / span 5' />
            {SAMPLE_SCENES.slice(1, 4).map((scene) => (
              <SceneCard key={scene.id} scene={scene} gridColumn='span 4' />
            ))}
          </SimpleGrid>
        </Stack>
      </Stack>
    </Box>
  );
}
