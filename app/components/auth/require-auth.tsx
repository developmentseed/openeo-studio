import { useAuth } from 'react-oidc-context';
import { Outlet } from 'react-router';

import { AuthLoading } from '$components/auth/auth-loading';
import { RestrictedPage } from '$components/auth/restricted-page';

export function RequireAuth() {
  const { isLoading, isAuthenticated } = useAuth();

  // react-oidc-context sets `isLoading` during silent renew (`signinSilent`),
  // including when the user is already authenticated. Blocking on that unmounts
  // protected pages and looks like a full refresh. Only block while we do not
  // yet know the user is signed in.
  const isBlockingAuthLoad = isLoading && !isAuthenticated;

  if (isBlockingAuthLoad) {
    return <AuthLoading />;
  }

  if (!isAuthenticated) {
    return <RestrictedPage />;
  }

  return <Outlet />;
}
