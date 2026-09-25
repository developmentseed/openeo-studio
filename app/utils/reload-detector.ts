/**
 * Detects and logs unexpected page reloads to help debug spontaneous refresh issues.
 */
export function setupReloadDetector() {
  // Track page load type
  const navigationEntries = performance.getEntriesByType(
    'navigation'
  ) as PerformanceNavigationTiming[];
  const navigationType = navigationEntries[0]?.type;

  // Check if this might be a Vite HMR reload
  const isDevMode = import.meta.env.DEV;
  const wasBeforeUnloadCalled =
    sessionStorage.getItem('beforeUnloadCalled') === 'true';

  // Clear the flag
  sessionStorage.removeItem('beforeUnloadCalled');

  // Log reload information
  if (navigationType === 'reload') {
    const reloadSource = wasBeforeUnloadCalled
      ? 'User or programmatic reload'
      : isDevMode
        ? 'Possibly Vite HMR'
        : 'Unknown';

    // eslint-disable-next-line no-console
    console.warn('[RELOAD] Page was reloaded', {
      timestamp: new Date().toISOString(),
      type: navigationType,
      source: reloadSource,
      beforeUnloadFired: wasBeforeUnloadCalled,
      devMode: isDevMode,
      referrer: document.referrer,
      url: window.location.href
    });
  } else {
    // eslint-disable-next-line no-console
    console.log('[RELOAD] Page loaded', {
      timestamp: new Date().toISOString(),
      type: navigationType,
      referrer: document.referrer,
      url: window.location.href
    });
  }

  // Detect beforeunload events (page about to reload/close)
  window.addEventListener('beforeunload', () => {
    // Set a flag in sessionStorage so we can detect it on next load
    sessionStorage.setItem('beforeUnloadCalled', 'true');

    // eslint-disable-next-line no-console
    console.warn('[RELOAD] Page is about to unload', {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      stack: new Error().stack
    });
  });

  // Track navigation that might cause reloads
  window.addEventListener('popstate', (event) => {
    // eslint-disable-next-line no-console
    console.log('[RELOAD] History navigation (popstate)', {
      timestamp: new Date().toISOString(),
      state: event.state,
      url: window.location.href
    });
  });

  window.addEventListener('hashchange', (event) => {
    // eslint-disable-next-line no-console
    console.log('[RELOAD] Hash change', {
      timestamp: new Date().toISOString(),
      oldURL: event.oldURL,
      newURL: event.newURL
    });
  });
}
