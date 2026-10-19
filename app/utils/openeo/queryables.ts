/**
 * openEO collection queryables helpers (GET /collections/{collection_id}/queryables).
 *
 * Queryables list the properties that `load_collection` can filter on. The
 * endpoint is optional in openEO API 1.2, so support is checked against the
 * capabilities document first.
 */

import { appConfig } from '$config/runtime';
import type { PropertyFilterOperator } from '$types';
import { fetchJson } from '../api';

const OPENEO_API_URL = appConfig.openeoApiUrl;
const QUERYABLES_PATH = '/collections/{collection_id}/queryables';

/** The default property filter, with its own `cloudCover` config field. */
export const CLOUD_COVER_PROPERTY = 'eo:cloud_cover';

/**
 * Queryables that are not offered as additional filters: `load_collection`
 * sets them with other arguments, or they have their own control.
 */
const EXCLUDED_PROPERTIES = new Set([
  'id',
  'collection',
  'geometry',
  'datetime',
  'start_datetime',
  'end_datetime',
  CLOUD_COVER_PROPERTY
]);

/** JSON Schema of one queryable (only the keywords that the UI uses). */
export interface QueryableSchema {
  title?: string;
  description?: string;
  type?: string | string[];
  enum?: (string | number | boolean)[];
  minimum?: number;
  maximum?: number;
}

/** Queryables of a collection, by property name. */
export type CollectionQueryables = Record<string, QueryableSchema>;

/**
 * Support of a property filter for a collection:
 * - `supported`: the property is a queryable
 * - `unsupported`: the backend lists queryables and the property is not one
 * - `unknown`: the backend has no queryables endpoint, or the request failed
 */
export type QueryableStatus = 'supported' | 'unsupported' | 'unknown';

export type QueryableKind = 'number' | 'string' | 'boolean';

type Capabilities = {
  endpoints?: { path: string; methods: string[] }[];
};

type QueryablesResponse = {
  properties?: Record<string, QueryableSchema>;
};

let capabilitiesSupport: Promise<boolean> | null = null;
const queryablesCache = new Map<string, Promise<CollectionQueryables>>();

function supportsQueryables(): Promise<boolean> {
  if (!capabilitiesSupport) {
    capabilitiesSupport = fetchJson<Capabilities>(`${OPENEO_API_URL}/`)
      .then(
        (capabilities) =>
          capabilities?.endpoints?.some(
            (endpoint) =>
              endpoint.path === QUERYABLES_PATH &&
              endpoint.methods.some((method) => method.toUpperCase() === 'GET')
          ) ?? false
      )
      .catch(() => {
        // Retry on the next call.
        capabilitiesSupport = null;
        return false;
      });
  }
  return capabilitiesSupport;
}

function fetchQueryables(collectionId: string): Promise<CollectionQueryables> {
  let queryables = queryablesCache.get(collectionId);
  if (!queryables) {
    queryables = fetchJson<QueryablesResponse>(
      `${OPENEO_API_URL}/collections/${encodeURIComponent(collectionId)}/queryables`
    ).then((payload) => payload?.properties ?? {});
    queryables.catch(() => queryablesCache.delete(collectionId));
    queryablesCache.set(collectionId, queryables);
  }
  return queryables;
}

/**
 * Returns the queryables of a collection, or `null` when they are not known
 * (no queryables endpoint, or the request failed).
 */
export async function getCollectionQueryables(
  collectionId: string
): Promise<CollectionQueryables | null> {
  try {
    if (!(await supportsQueryables())) return null;
    return await fetchQueryables(collectionId);
  } catch {
    return null;
  }
}

/** Tells if `property` can be used in a `load_collection` property filter. */
export function getQueryableStatus(
  queryables: CollectionQueryables | null,
  property: string
): QueryableStatus {
  if (!queryables) return 'unknown';
  return property in queryables ? 'supported' : 'unsupported';
}

/** Returns the value kind of a queryable, or `null` when not supported. */
export function getQueryableKind(
  schema: QueryableSchema
): QueryableKind | null {
  const types = Array.isArray(schema.type) ? schema.type : [schema.type];
  if (types.includes('number') || types.includes('integer')) return 'number';
  if (types.includes('boolean')) return 'boolean';
  if (types.includes('string') || schema.enum?.length) return 'string';
  return null;
}

/** Comparison operators that apply to a value kind. */
export function getOperatorsForKind(
  kind: QueryableKind
): PropertyFilterOperator[] {
  return kind === 'number'
    ? ['lt', 'lte', 'gt', 'gte', 'eq', 'neq']
    : ['eq', 'neq'];
}

/**
 * Returns the queryables that the user can add as additional filters, sorted
 * by property name. Excludes properties set by other `load_collection`
 * arguments, cloud cover, and properties with an unsupported type.
 */
export function getFilterableQueryables(
  queryables: CollectionQueryables
): [string, QueryableSchema][] {
  return Object.entries(queryables)
    .filter(
      ([property, schema]) =>
        !EXCLUDED_PROPERTIES.has(property) && getQueryableKind(schema) !== null
    )
    .sort(([a], [b]) => a.localeCompare(b));
}

/** Clears the cached capabilities and queryables (for tests). */
export function clearQueryablesCache() {
  capabilitiesSupport = null;
  queryablesCache.clear();
}
