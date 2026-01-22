import { useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import { Heading, Spinner, Text, VStack } from '@chakra-ui/react';
import { useNavigate } from 'react-router';

export default function Callback() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // Get the return path from user state
      const returnTo =
        (user.state as { returnTo?: string } | null)?.returnTo || '/';
      // Navigate immediately
      navigate(returnTo, { replace: true });
    } else if (!isLoading && !isAuthenticated) {
      // Auth failed, redirect home
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isLoading, user, navigate]);

  return (
    <VStack
      as='main'
      h='100%'
      gap={4}
      alignItems='center'
      justifyContent='center'
    >
      <title>OpenEo Studio - Logging in</title>

      <Heading size='xl'>Signing you in…</Heading>
      <Spinner size='lg' />
      <Text fontSize='md' color='gray.600'>
        Please wait…
      </Text>
    </VStack>
  );
}
