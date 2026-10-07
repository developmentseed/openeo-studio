import { Heading, Text, VStack } from '@chakra-ui/react';
import { LoginButton } from '$components/auth/login-button';
import { useIsAuthDisabled } from '$components/auth/disabled-auth-provider';
import { APP_TITLE } from '$config/constants';

export function RestrictedPage() {
  const isAuthDisabled = useIsAuthDisabled();

  return (
    <VStack as='main' h='100%' gap={4} py={20} w='100%'>
      <title>{APP_TITLE} - Sign in required</title>

      <Heading size='7xl'>Restricted</Heading>
      <Text fontSize='2xl' mt={4} textAlign='center'>
        {isAuthDisabled
          ? 'This page needs a signed-in user, but the openEO backend does not support login.'
          : 'Sign in to your account to analyze satellite data and visualize results on the map.'}
      </Text>
      <LoginButton size='md' />
    </VStack>
  );
}
