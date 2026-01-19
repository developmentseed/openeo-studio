import { useState } from 'react';
import { Box, Button, Flex, Heading, Text } from '@chakra-ui/react';
import { useAuth } from 'react-oidc-context';
import { useNavigate } from 'react-router';
import { SceneGrid } from '$components/landing/scene-grid';
import { DataConfigDialog } from '$components/setup/data-config-dialog';
import { APP_TITLE } from '$config/constants';
import { BLANK_SCENE_ID } from '$config/sample-scenes';
import { DocsPageModal } from './docs-modal-page';

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
          <Heading as='h1' size='2xl'>
            Welcome to the {APP_TITLE} for Sentinel EOPF
          </Heading>

          <Box maxW='3xl'>
            <Text fontSize='lg' color='gray.600'>
              Write and execute openEO python code directly in your browser to
              process cloud&#8209;native Sentinel EOPF Zarr data. Visualize
              results instantly with on&#8209;the&#8209;fly rendering.
            </Text>
          </Box>

          <Box>
            <DocsPageModal
              trigger={
                <Button variant='outline'>
                  Read the docs{' '}
                  <svg
                    version='1.1'
                    xmlns='http://www.w3.org/2000/svg'
                    width='16'
                    height='16'
                    viewBox='0 0 16 16'
                    style={{ fill: 'currentColor' }}
                  >
                    <rect width='16' height='16' id='icon-bound' fill='none' />
                    <polygon points='7.586,2.414 12.172,7 0,7 0,9 12.172,9 7.586,13.586 9,15 16,8 9,1' />
                  </svg>
                </Button>
              }
            />
          </Box>
        </Flex>

        <Heading size='xl'>Explore the sample visualization processing</Heading>

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
