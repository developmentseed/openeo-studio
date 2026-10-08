import { useEffect } from 'react';
import { Flex } from '@chakra-ui/react';

import { ErrorState } from '$components/common/error-state';
import { LogoComposition, NameComposition } from '$components/layout/brand';
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
    <Flex
      as='main'
      minH='100vh'
      bg='bg.subtle'
      align='center'
      justify='center'
      px={{ base: 4, md: 8 }}
      py={{ base: 12, md: 20 }}
    >
      <title>{`${APP_TITLE} - Configuration error`}</title>

      <ErrorState
        header={
          <Flex align='center' gap={2}>
            <LogoComposition />
            <NameComposition />
          </Flex>
        }
        label='Configuration error'
        title={TITLES[reason]}
        message={message}
        details={[
          { label: 'openEO backend', value: apiUrl, code: true },
          { label: 'Details', value: details ?? [] }
        ]}
      />
    </Flex>
  );
}
