import { useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import { Heading, Spinner, Text, VStack } from '@chakra-ui/react';
import { useNavigate } from 'react-router';

export default function Callback() {
  const { isAuthenticated, user } = useAuth();

  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Prefer explicit returnTo value from state, fall back to any
      // stored post-auth path, otherwise go home.
      const returnTo = (user.state as { returnTo?: string } | null)?.returnTo;
      const postAuthPath = window.sessionStorage.getItem('postAuthPath');
      const redirectUrl = returnTo || postAuthPath || '/';

      if (postAuthPath) {
        window.sessionStorage.removeItem('postAuthPath');
      }

      navigate(redirectUrl, { replace: true });
    }
  }, [isAuthenticated, navigate, user]);

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
