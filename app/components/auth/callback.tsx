import { useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import { Heading, Text, VStack } from '@chakra-ui/react';
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
    <VStack as='main' h='100%' gap={0} p={20}>
      <title>OpenEo Studio - Logging in</title>

      <Heading size='7xl'>Hello!</Heading>
      <Text fontSize='2xl' mt={4}>
        You are being logged in. Please wait...
      </Text>
    </VStack>
  );
}
