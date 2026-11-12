/**
 * Helpers for `load_collection` property filters.
 */

import type { PropertyFilter } from '$types';

export const CLOUD_COVER_PROPERTY = 'eo:cloud_cover';

/** Builds a cloud cover filter: `eo:cloud_cover < max`. */
export function cloudCoverFilter(max: number): PropertyFilter {
  return { property: CLOUD_COVER_PROPERTY, operator: 'lt', value: max };
}

/**
 * Returns the property filters of a configuration. Converts the deprecated
 * `cloudCover` field to a cloud cover filter, unless `propertyFilters`
 * already has one.
 */
export function resolvePropertyFilters(config: {
  cloudCover?: number;
  propertyFilters?: PropertyFilter[];
}): PropertyFilter[] {
  const filters = config.propertyFilters ?? [];
  if (
    typeof config.cloudCover !== 'number' ||
    filters.some((filter) => filter.property === CLOUD_COVER_PROPERTY)
  ) {
    return filters;
  }
  return [cloudCoverFilter(config.cloudCover), ...filters];
}

/** The `eo:cloud_cover < max` filter's max, if `filters` has one. */
export function cloudCoverOf(filters: PropertyFilter[]): number | undefined {
  const filter = filters.find(
    (filter) =>
      filter.property === CLOUD_COVER_PROPERTY && filter.operator === 'lt'
  );
  return typeof filter?.value === 'number' ? filter.value : undefined;
}

/**
 * Returns `filters` with the cloud cover filter set to `eo:cloud_cover < max`,
 * in place of any other cloud cover filter. The other filters do not change.
 */
export function withCloudCover(
  filters: PropertyFilter[],
  max: number
): PropertyFilter[] {
  const others = filters.filter(
    (filter) => filter.property !== CLOUD_COVER_PROPERTY
  );
  return [cloudCoverFilter(max), ...others];
}
