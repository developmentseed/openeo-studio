import { Heading, Text, VStack } from '@chakra-ui/react';
import { LoginButton } from '$components/auth/login-button';
import { APP_TITLE } from '$config/constants';

export function RestrictedPage() {
  return (
    <VStack as='main' h='100%' gap={4} py={20} w='100%'>
      <title>{APP_TITLE} - Sign in required</title>

      <Heading size='7xl'>Restricted</Heading>
      <Text fontSize='2xl' mt={4} textAlign='center'>
        Sign in to your account to analyze satellite data and visualize results
        on the map.
      </Text>
      <LoginButton size='md' />
    </VStack>
  );
}
