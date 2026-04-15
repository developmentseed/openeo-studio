import { useEffect, useRef } from 'react';
import { useAuth } from 'react-oidc-context';

import { cleanupOrphanedServices } from '../utils/code-runner';
import { getInstanceId } from '../utils/instance-id';

/**
 * Hook that cleans up orphaned ephemeral services from previous sessions
 * when the user becomes authenticated. Runs once per app lifecycle.
 */
export function useServiceCleanup() {
  const { isAuthenticated, user } = useAuth();
  const hasCleanedUp = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !user?.access_token || hasCleanedUp.current) return;

    hasCleanedUp.current = true;
    const instanceId = getInstanceId();

    cleanupOrphanedServices(user.access_token, instanceId).then(() => {
      // eslint-disable-next-line no-console
      console.log(
        '[SERVICES] Startup cleanup completed for instance',
        instanceId
      );
    });
  }, [isAuthenticated, user]);
}
