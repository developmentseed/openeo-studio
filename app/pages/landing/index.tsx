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
import { Navigate, NavLink, useSearchParams } from 'react-router';
import { useAuth } from 'react-oidc-context';
import { LuArrowRight } from 'react-icons/lu';

import { APP_TITLE } from '$config/constants';
import { SAMPLE_SCENES } from '$config/sample-scenes';
import { LoginButton } from '$components/auth/login-button';
import { SceneCard } from '$pages/projects/scene-card';
import { useOpenEntry } from '$components/catalogue/use-open-entry';
import { entryHref } from '$utils/catalogue/links';
import { sampleToEntry } from '$utils/catalogue/sources/samples';
import type { SampleScene } from '$types';

import herolightImg from './heroillu-light.svg';
import herodarkImg from './heroillu-dark.svg';
import { useColorModeValue } from '$contexts/color-mode';

export function LandingPage() {
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const projectUrl = searchParams.get('project_url');
  const { openEntry, pendingRef, dialog } = useOpenEntry();

  const sampleCard = (scene: SampleScene, gridColumn: string) => {
    const entry = sampleToEntry(scene);
    return (
      <SceneCard
        name={entry.name}
        description={entry.description}
        thumbnail={entry.thumbnail}
        collectionId={entry.collectionId}
        gridColumn={gridColumn}
        href={entryHref(entry.open)}
        isBusy={pendingRef === entry.open.ref}
        onOpen={() => openEntry(entry.open)}
      />
    );
  };

  const heroImg = useColorModeValue(herolightImg, herodarkImg);

  // APEx record links point here; the editor does the loading.
  if (projectUrl) {
    return (
      <Navigate
        replace
        to={`/editor?project_url=${encodeURIComponent(projectUrl)}`}
      />
    );
  }

  return (
    <Box flex={1}>
      <Stack h='100%' gap={4}>
        <Flex
          gap={4}
          justifyContent='space-between'
          alignItems='center'
          px={2}
          py={4}
          pr={2}
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
              <Image src={heroImg} objectFit='contain' />
            </Flex>
          </SimpleGrid>

          <SimpleGrid columns={12} gap={8} w='100%'>
            {sampleCard(SAMPLE_SCENES[0], '2 / span 3')}
            {sampleCard(SAMPLE_SCENES[1], 'span 3')}

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

            {sampleCard(SAMPLE_SCENES[2], 'span 3')}
            {sampleCard(SAMPLE_SCENES[3], 'span 3')}

            {sampleCard(SAMPLE_SCENES[4], '5 / span 3')}

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
      {dialog}
    </Box>
  );
}
