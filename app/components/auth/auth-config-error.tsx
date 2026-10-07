import { useEffect } from 'react';
import { Box, Button, Code, Heading, Text, VStack } from '@chakra-ui/react';

import { APP_TITLE } from '$config/constants';
import type { OidcResolution } from '$config/oidc';

type AuthConfigErrorProps = Extract<OidcResolution, { status: 'error' }> & {
  apiUrl: string;
};

const TITLES: Record<AuthConfigErrorProps['reason'], string> = {
  unreachable: 'Cannot connect to the openEO backend',
  'no-client': 'Login is not configured for this app',
  incomplete: 'The login configuration is not complete'
};

/**
 * Full-page error when studio cannot make the OIDC configuration. It shows
 * before the router and the auth provider, so it uses Chakra only.
 */
export function AuthConfigError(props: AuthConfigErrorProps) {
  const { reason, message, details, apiUrl } = props;

  useEffect(() => {
    // Remove the welcome banner of index.html.
    dispatchEvent(new Event('app-ready'));
  }, []);

  return (
    <VStack as='main' minH='100vh' gap={4} py={20} px={8} bg='bg.subtle'>
      <title>{`${APP_TITLE} - Configuration error`}</title>

      <Heading size='3xl' textAlign='center'>
        {TITLES[reason]}
      </Heading>
      <Text fontSize='lg' textAlign='center' maxW='40rem'>
        {message}
      </Text>
      {details?.map((detail) => (
        <Text key={detail} color='fg.muted' textAlign='center' maxW='40rem'>
          {detail}
        </Text>
      ))}
      <Box>
        <Text color='fg.muted' fontSize='sm'>
          openEO backend: <Code>{apiUrl}</Code>
        </Text>
      </Box>
      <Button
        colorPalette='primary'
        onClick={() => window.location.reload()}
        mt={4}
      >
        Try again
      </Button>
    </VStack>
  );
}
