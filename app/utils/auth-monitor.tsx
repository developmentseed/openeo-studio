import { useEffect, useRef } from 'react';
import { useAuth } from 'react-oidc-context';

/**
 * Component that monitors authentication state changes and logs them.
 * This helps debug spontaneous reloads caused by auth events.
 */
export function AuthMonitor() {
  const auth = useAuth();
  const prevAuthStateRef = useRef({
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    error: auth.error
  });
  const hasWarnedAboutExpiredTokenRef = useRef(false);

  useEffect(() => {
    prevAuthStateRef.current = {
      isAuthenticated: auth.isAuthenticated,
      isLoading: auth.isLoading,
      error: auth.error
    };
  }, [auth.isAuthenticated, auth.isLoading, auth.error, auth.user]);

  // Monitor token expiration and force re-login if expired
  useEffect(() => {
    if (!auth.user) return;

    const checkTokenExpiration = () => {
      const expiresAt = auth.user?.expires_at;
      if (!expiresAt) return;

      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = expiresAt - now;

      // Token is already expired - clear it immediately
      if (timeUntilExpiry < 0 && !hasWarnedAboutExpiredTokenRef.current) {
        hasWarnedAboutExpiredTokenRef.current = true;

        // Clear the expired token to prevent silent renewal loops
        auth.removeUser();

        // Also clear from storage as backup
        try {
          window.localStorage.removeItem(
            'oidc.user:' +
              window.location.origin +
              ':' +
              auth.settings?.client_id
          );
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
          // Ignore errors
        }

        return;
      }

      // Token is still valid - no action needed
      if (timeUntilExpiry <= 0) {
        return;
      }
    };

    // Check immediately on mount
    checkTokenExpiration();

    // Check every 60 seconds
    const interval = setInterval(() => {
      checkTokenExpiration();
    }, 60000);

    return () => clearInterval(interval);
  }, [auth.user, auth.settings?.client_id, auth.removeUser]);

  return null;
}
