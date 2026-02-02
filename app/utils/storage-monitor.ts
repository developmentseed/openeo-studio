/**
 * Monitors sessionStorage changes to help debug state-related issues.
 * Only logs in development mode.
 */
let sessionStorageMonitoringInitialized = false;

export function monitorSessionStorage() {
  if (sessionStorageMonitoringInitialized) {
    return;
  }
  sessionStorageMonitoringInitialized = true;
  const originalSetItem = window.sessionStorage.setItem;
  const originalRemoveItem = window.sessionStorage.removeItem;

  window.sessionStorage.setItem = function (key: string, value: string) {
    // Skip logging React DevTools internal keys
    if (!key.startsWith('React::DevTools::')) {
      // eslint-disable-next-line no-console
      console.log('[STORAGE] setItem', { key, value });
    }
    return originalSetItem.call(this, key, value);
  };

  window.sessionStorage.removeItem = function (key: string) {
    // Skip logging React DevTools internal keys
    if (!key.startsWith('React::DevTools::')) {
      // eslint-disable-next-line no-console
      console.log('[STORAGE] removeItem', { key });
    }
    return originalRemoveItem.call(this, key);
  };
}
