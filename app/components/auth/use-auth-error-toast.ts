import { useEffect } from 'react';
import { useAuth } from 'react-oidc-context';

import { toaster } from '$utils/toaster';

const TITLES: Record<string, string> = {
  signinCallback: 'Login failed',
  signinRedirect: 'Cannot start the login',
  signinPopup: 'Login failed',
  signoutCallback: 'Logout failed',
  signoutRedirect: 'Logout failed',
  signoutPopup: 'Logout failed'
};

/**
 * Shows an error toast when a login or logout fails. For example, when the
 * identity provider rejects the token request after the redirect. The toast
 * stays until the user closes it.
 *
 * Silent renew errors are not shown: AuthMonitor handles token expiry.
 */
export function useAuthErrorToast() {
  const { error } = useAuth();

  useEffect(() => {
    if (!error) return;

    const title = TITLES[error.source];
    if (!title) return;

    // eslint-disable-next-line no-console
    console.error(`[AUTH] ${error.source} failed`, error.innerError ?? error);

    toaster.error({
      id: `auth-error-${error.source}`,
      title,
      description: error.message,
      duration: Infinity,
      closable: true
    });
  }, [error]);
}
