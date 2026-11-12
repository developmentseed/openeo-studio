/**
 * Checks whether a project's collection and bands exist on the connected
 * openEO backend. Project files are written for one backend's naming, so a
 * catalogue entry is only usable when this check passes.
 */
import type { StacCollection } from 'stac-ts';

import { DEFAULT_EDITOR_CONFIG } from '$config/default-editor-config';
import { appConfig } from '$config/runtime';
import type { EditorSeed } from '$types';
import { APIError, fetchJson } from '$utils/api';
import { getCollectionQueryables } from '$utils/openeo/queryables';
import { collectionBandIdentifiers } from '$utils/stac-band-parser';

export type Compatibility =
  { compatible: true } | { compatible: false; reason: string };

// null means the backend doesn't have that collection.
const collections = new Map<string, Promise<StacCollection | null>>();

// The EOPF and MPC backends answer 500 with a wrapped `NotFoundError`.
const isMissingCollection = (error: unknown) =>
  error instanceof APIError &&
  (error.code === 404 ||
    (JSON.stringify(error.detail) ?? '').includes('NotFoundError'));

/**
 * Fetches a collection from the backend, caching the result. Returns null if
 * the backend doesn't have it.
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
      if (isMissingCollection(error)) return null;
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
 * Keeps the values of a seed that the connected backend supports, and names
 * the ones it doesn't. An unavailable collection falls back to the default
 * one, and the bands and filters are then checked against that collection.
 *
 * @param seed The seed to check
 * @param authToken User auth token
 * @returns The supported seed and a message for each value left out
 */
export async function reconcileSeed(
  seed: EditorSeed,
  authToken?: string
): Promise<{ seed: EditorSeed; incompatibilities: string[] }> {
  const incompatibilities: string[] = [];

  let { collectionId } = seed;
  let collection = await fetchCollection(collectionId, authToken);
  if (!collection) {
    const fallback = DEFAULT_EDITOR_CONFIG.collectionId;
    incompatibilities.push(
      `Collection "${collectionId}" is not available. Using "${fallback}" instead.`
    );
    collectionId = fallback;
    collection = await fetchCollection(collectionId, authToken);
  }

  const identifiers = collectionBandIdentifiers(collection);
  const bands = seed.bands.filter((band) => identifiers.has(band));
  const missing = seed.bands.filter((band) => !identifiers.has(band));
  if (missing.length > 0) {
    const names = missing.map((band) => `"${band}"`).join(', ');
    incompatibilities.push(
      missing.length === 1
        ? `Band ${names} is not available in "${collectionId}".`
        : `Bands ${names} are not available in "${collectionId}".`
    );
  }

  const queryables = await getCollectionQueryables(collectionId);
  const propertyFilters = seed.propertyFilters.filter((filter) => {
    if (!queryables || filter.property in queryables) return true;
    incompatibilities.push(
      `Property "${filter.property}" can't be filtered on in "${collectionId}".`
    );
    return false;
  });

  return {
    seed: { ...seed, collectionId, bands, propertyFilters },
    incompatibilities
  };
}

/**
 * Clears the cache of fetched collections.
 */
export function clearCompatibilityCache(): void {
  collections.clear();
}
