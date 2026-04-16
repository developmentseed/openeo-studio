const STORAGE_KEY_PREFIX = 'openeo-studio-instance-id';

/**
 * Returns a stable instance UUID for the current studio deployment.
 * The UUID is scoped to `window.location.origin` so different deployments
 * (production, staging, local dev) each get their own identity.
 * Stored in localStorage and reused across sessions and tabs.
 */
export function getInstanceId(): string {
  const origin = window.location.origin;
  const key = `${STORAGE_KEY_PREFIX}:${origin}`;

  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }

  return id;
}
