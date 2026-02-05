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
    const prev = prevAuthStateRef.current;
    const changed = {
      isAuthenticated: prev.isAuthenticated !== auth.isAuthenticated,
      isLoading: prev.isLoading !== auth.isLoading,
      error: prev.error !== auth.error
    };

    if (changed.isAuthenticated || changed.isLoading || changed.error) {
      // eslint-disable-next-line no-console
      console.log('[AUTH] State changed', {
        timestamp: new Date().toISOString(),
        changes: changed,
        current: {
          isAuthenticated: auth.isAuthenticated,
          isLoading: auth.isLoading,
          error: auth.error?.message,
          user: auth.user?.profile?.email
        },
        previous: {
          isAuthenticated: prev.isAuthenticated,
          isLoading: prev.isLoading,
          error: prev.error?.message
        }
      });

      prevAuthStateRef.current = {
        isAuthenticated: auth.isAuthenticated,
        isLoading: auth.isLoading,
        error: auth.error
      };
    }
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
        // eslint-disable-next-line no-console
        console.error('[AUTH] Token is expired!', {
          expiredSecondsAgo: Math.abs(timeUntilExpiry),
          expiresAt: new Date(expiresAt * 1000).toISOString(),
          currentTime: new Date(now * 1000).toISOString(),
          action: 'Clearing expired token to prevent reload loops'
        });

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
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error(
            '[AUTH] Error clearing expired token from localStorage',
            {
              error: e
            }
          );
        }

        return;
      }

      // Only log if token is still valid
      if (timeUntilExpiry > 0) {
        // eslint-disable-next-line no-console
        console.log('[AUTH] Token check', {
          expiresAt: new Date(expiresAt * 1000).toISOString(),
          timeUntilExpiry: `${timeUntilExpiry}s`,
          willExpireSoon: timeUntilExpiry < 300 // Less than 5 minutes
        });

        if (timeUntilExpiry < 60) {
          // eslint-disable-next-line no-console
          console.warn('[AUTH] Token expiring soon!', {
            secondsRemaining: timeUntilExpiry,
            automaticSilentRenew: 'will attempt renewal'
          });
        }
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

  // Monitor active navigator (for silent renewals)
  useEffect(() => {
    if (!auth.activeNavigator) return;

    // eslint-disable-next-line no-console
    console.log('[AUTH] Active navigator detected', {
      timestamp: new Date().toISOString(),
      type: auth.activeNavigator
    });

    return () => {
      // eslint-disable-next-line no-console
      console.log('[AUTH] Active navigator cleared', {
        timestamp: new Date().toISOString()
      });
    };
  }, [auth.activeNavigator]);

  // Monitor auth errors (including silent renewal failures)
  useEffect(() => {
    if (!auth.error) return;

    // eslint-disable-next-line no-console
    console.error('[AUTH] Error occurred', {
      timestamp: new Date().toISOString(),
      error: auth.error.message,
      errorDetails: {
        name: auth.error.name,
        message: auth.error.message,
        source: auth.error.source
      },
      userAuthenticated: auth.isAuthenticated,
      action: 'Check if this error caused any navigation or reload'
    });
  }, [auth.error, auth.isAuthenticated]);

  return null;
}
