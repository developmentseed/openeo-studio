/**
 * Helpers for `load_collection` property filters.
 */

import type { PropertyFilter, PropertyFilterOperator } from '$types';

export const CLOUD_COVER_PROPERTY = 'eo:cloud_cover';

export const PROPERTY_FILTER_OPERATORS: PropertyFilterOperator[] = [
  'lt',
  'lte',
  'gt',
  'gte',
  'eq',
  'neq'
];

/** Builds a cloud cover filter: `eo:cloud_cover < max`. */
export function cloudCoverFilter(max: number): PropertyFilter {
  return { property: CLOUD_COVER_PROPERTY, operator: 'lt', value: max };
}

export function isPropertyFilter(value: unknown): value is PropertyFilter {
  const filter = value as Partial<PropertyFilter> | null;
  return (
    typeof filter?.property === 'string' &&
    PROPERTY_FILTER_OPERATORS.includes(filter.operator!) &&
    ['number', 'string', 'boolean'].includes(typeof filter.value)
  );
}

/**
 * Returns the valid property filters of an untrusted configuration (e.g. a
 * project file). Converts the deprecated `cloudCover` field to a cloud cover
 * filter, unless `propertyFilters` already has one.
 *
 * The `cloudCover` conversion is only for the APEx algorithm project files
 * (`openeo_studio/project.json`), which still use `cloudCover`. Remove it once
 * they use `propertyFilters`.
 */
export function resolvePropertyFilters(config: {
  cloudCover?: unknown;
  propertyFilters?: unknown;
}): PropertyFilter[] {
  const filters = Array.isArray(config.propertyFilters)
    ? config.propertyFilters.filter(isPropertyFilter)
    : [];
  if (
    typeof config.cloudCover !== 'number' ||
    filters.some((filter) => filter.property === CLOUD_COVER_PROPERTY)
  ) {
    return filters;
  }
  return [cloudCoverFilter(config.cloudCover), ...filters];
}
