import { Flex, Spinner } from '@chakra-ui/react';
import { useAuth } from 'react-oidc-context';
import { Outlet } from 'react-router';

import { RestrictedPage } from '$components/auth/restricted-page';

export function RequireAuth() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <Flex flex={1} alignItems='center' justifyContent='center'>
        <Spinner size='lg' />
      </Flex>
    );
  }

  if (!isAuthenticated) {
    return <RestrictedPage />;
  }

  return <Outlet />;
}
