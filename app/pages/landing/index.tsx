import { useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Image,
  SimpleGrid,
  Stack,
  Text
} from '@chakra-ui/react';
import { NavLink } from 'react-router';
import { useAuth } from 'react-oidc-context';
import { LuArrowRight } from 'react-icons/lu';

import { APP_TITLE } from '$config/constants';
import { SAMPLE_SCENES } from '$config/sample-scenes';
import { useEditorStore } from '$stores/editor-store';
import { LoginButton } from '$components/auth/login-button';
import { SceneCard } from '$pages/projects/scene-card';

import herolightImg from './heroillu-light.svg';
import herodarkImg from './heroillu-dark.svg';
import { useColorModeValue } from '$contexts/color-mode';

export function LandingPage() {
  const { clearEditor } = useEditorStore();
  const { isAuthenticated } = useAuth();

  // Clear editor state when navigating to landing to ensure fresh scene loads
  useEffect(() => {
    clearEditor();
  }, [clearEditor]);

  const heroImg = useColorModeValue(herolightImg, herodarkImg);

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
        <Stack p={4} gap={12} maxWidth='8xl' mx='auto'>
          <SimpleGrid columns={12} gap={8} w='100%'>
            <Stack
              gridColumn='2 / span 5'
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
            <Flex gridColumn='8 / span 4' justify='center'>
              <Image src={heroImg} />
            </Flex>
          </SimpleGrid>

          <SimpleGrid columns={12} gap={8} w='100%'>
            <SceneCard scene={SAMPLE_SCENES[0]} gridColumn='2 / span 3' />
            <SceneCard scene={SAMPLE_SCENES[1]} gridColumn='span 3' />

            <Stack
              gridColumn='8 / span 3'
              gap={4}
              align='start'
              justify='center'
            >
              <Heading as='h3'>Access an extensive algorithm catalog</Heading>
              <Text>
                These are some of the sample scenes you&apos;ll have access to
                once you create an account and login.
              </Text>
            </Stack>

            <Stack
              gridColumn='2 / span 3'
              gap={4}
              align='start'
              justify='center'
            >
              <Heading as='h3'>Develop your own</Heading>
              <Text>
                Start from scratch or use one of the existing examples as a
                starting point.
              </Text>
              <Button variant='outline' asChild>
                <NavLink to='/docs' end>
                  Learn More <LuArrowRight />
                </NavLink>
              </Button>
            </Stack>

            <SceneCard scene={SAMPLE_SCENES[2]} gridColumn='span 3' />
            <SceneCard scene={SAMPLE_SCENES[3]} gridColumn='span 3' />

            <SceneCard scene={SAMPLE_SCENES[4]} gridColumn='5 / span 3' />

            {!isAuthenticated && (
              <Stack gridColumn='span 3' gap={4} align='start' justify='center'>
                <Heading as='h3'>Login and get started</Heading>
                <Text>
                  Start from scratch or use one of the existing examples as a
                  starting point.
                </Text>

                <LoginButton size='md' />
              </Stack>
            )}
          </SimpleGrid>
        </Stack>
      </Stack>
    </Box>
  );
}
