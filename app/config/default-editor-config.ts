import type { PropertyFilter } from '$types';
import { cloudCoverFilter } from '$utils/property-filters';

export type EditorConfigValues = {
  collectionId: string;
  temporalRange: [string, string];
  /** Property filters on collection queryables (e.g. cloud cover) */
  propertyFilters: PropertyFilter[];
  selectedBands: string[];
  boundingBox?: [number, number, number, number];
};

export const DEFAULT_EDITOR_CONFIG: EditorConfigValues = {
  collectionId: 'sentinel-2-l2a',
  temporalRange: ['', ''],
  propertyFilters: [cloudCoverFilter(50)],
  selectedBands: [],
  boundingBox: undefined
};

export function createInitialConfig(
  overrides: Partial<EditorConfigValues> = {}
): EditorConfigValues {
  return {
    ...DEFAULT_EDITOR_CONFIG,
    ...overrides
  };
}
