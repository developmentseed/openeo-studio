/**
 * Checks whether a project's collection and bands exist on the connected
 * openEO backend. Project files are written for one backend's naming, so a
 * catalogue entry is only usable when this check passes.
 */
import type { StacCollection } from 'stac-ts';

import { appConfig } from '$config/runtime';
import { APIError, fetchJson } from '$utils/api';
import { collectionBandIdentifiers } from '$utils/stac-band-parser';

export type Compatibility =
  { compatible: true } | { compatible: false; reason: string };

// null means the backend answered 404 for that collection.
const collections = new Map<string, Promise<StacCollection | null>>();

/**
 * Fetches a collection from the backend, caching the result. Returns null if
 * the backend answered 404.
 */
function fetchCollection(
  collectionId: string,
  authToken?: string
): Promise<StacCollection | null> {
  let pending = collections.get(collectionId);
  if (!pending) {
    pending = fetchJson<StacCollection>(
      `${appConfig.openeoApiUrl}/collections/${encodeURIComponent(collectionId)}`,
      authToken
    ).catch((error) => {
      if (error instanceof APIError && error.code === 404) return null;
      collections.delete(collectionId);
      throw error;
    });
    collections.set(collectionId, pending);
  }
  return pending;
}

/**
 * Checks whether a project's collection and bands exist on the connected
 * openEO backend. Project files are written for one backend's naming, so a
 * catalogue entry is only usable when this check passes.
 *
 * @param target The collection id and bands to check
 * @param authToken User auth token
 * @returns Object with `compatible` boolean and optional `reason` string if not
 * compatible
 */
export async function checkCompatibility(
  target: { collectionId: string; bands: string[] },
  authToken?: string
): Promise<Compatibility> {
  const { collectionId, bands } = target;
  const collection = await fetchCollection(collectionId, authToken);
  if (!collection) {
    return {
      compatible: false,
      reason: `collection \`${collectionId}\` is not available`
    };
  }

  const identifiers = collectionBandIdentifiers(collection);
  const missing = bands.filter((band) => !identifiers.has(band));
  if (missing.length === 0) return { compatible: true };

  const names = missing.map((band) => `\`${band}\``).join(', ');
  return {
    compatible: false,
    reason:
      missing.length === 1
        ? `band ${names} is not available in \`${collectionId}\``
        : `bands ${names} are not available in \`${collectionId}\``
  };
}

/**
 * Clears the cache of fetched collections.
 */
export function clearCompatibilityCache(): void {
  collections.clear();
}
