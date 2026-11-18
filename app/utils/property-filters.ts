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
