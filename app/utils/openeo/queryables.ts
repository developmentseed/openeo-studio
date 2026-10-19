/**
 * openEO collection queryables helpers (GET /collections/{collection_id}/queryables).
 *
 * Queryables list the properties that `load_collection` can filter on. The
 * endpoint is optional in openEO API 1.2, so support is checked against the
 * capabilities document first.
 */

import { appConfig } from '$config/runtime';
import type { PropertyFilter, PropertyFilterOperator } from '$types';
import { CLOUD_COVER_PROPERTY } from '$utils/property-filters';
import { fetchJson } from '../api';

const OPENEO_API_URL = appConfig.openeoApiUrl;
const QUERYABLES_PATH = '/collections/{collection_id}/queryables';

/**
 * Queryables that are not offered as filters: `load_collection` sets them
 * with other arguments.
 */
const EXCLUDED_PROPERTIES = new Set([
  'id',
  'collection',
  'geometry',
  'datetime',
  'start_datetime',
  'end_datetime'
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
 * Schemas of well-known properties. They are offered when the backend has no
 * queryables, and complete the backend schemas (e.g. the cloud cover range).
 */
const KNOWN_QUERYABLES: CollectionQueryables = {
  [CLOUD_COVER_PROPERTY]: {
    title: 'Cloud cover',
    description: 'Cloud cover percentage',
    type: 'number',
    minimum: 0,
    maximum: 100
  }
};

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

/**
 * Returns the queryables to offer in the UI:
 * - With backend queryables: these, completed with the known schemas.
 * - Without (`null`): the known queryables, and a schema inferred from the
 *   value of each current filter, so that every filter stays editable.
 */
export function resolveQueryables(
  queryables: CollectionQueryables | null,
  filters: PropertyFilter[]
): CollectionQueryables {
  if (queryables) {
    return Object.fromEntries(
      Object.entries(queryables).map(([property, schema]) => [
        property,
        { ...KNOWN_QUERYABLES[property], ...schema }
      ])
    );
  }

  const resolved: CollectionQueryables = { ...KNOWN_QUERYABLES };
  for (const filter of filters) {
    resolved[filter.property] ??= { type: typeof filter.value };
  }
  return resolved;
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
 * Returns the queryables that the user can filter on, sorted by property
 * name. Excludes properties set by other `load_collection` arguments, and
 * properties with an unsupported type.
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
