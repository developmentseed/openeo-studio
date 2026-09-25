/** Service title conventions for backend-side discovery. */

export const EPHEMERAL_TITLE_PREFIX = 'openeo-studio:ephemeral:';
export const PERMANENT_TITLE_PREFIX = 'openeo-studio:permanent:';

export function ephemeralTitleFor(instanceId: string): string {
  return `${EPHEMERAL_TITLE_PREFIX}${instanceId}`;
}
export function permanentTitleFor(instanceId: string): string {
  return `${PERMANENT_TITLE_PREFIX}${instanceId}`;
}

export function isPermanentTitle(title: string | undefined): boolean {
  return Boolean(title?.startsWith(PERMANENT_TITLE_PREFIX));
}
