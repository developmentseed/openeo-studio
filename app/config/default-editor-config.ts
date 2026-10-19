import type { PropertyFilter } from '$types';

export type EditorConfigValues = {
  collectionId: string;
  temporalRange: [string, string];
  cloudCover?: number;
  /** Additional property filters on collection queryables */
  propertyFilters: PropertyFilter[];
  selectedBands: string[];
  boundingBox?: [number, number, number, number];
};

export const DEFAULT_EDITOR_CONFIG: EditorConfigValues = {
  collectionId: 'sentinel-2-l2a',
  temporalRange: ['', ''],
  cloudCover: 50,
  propertyFilters: [],
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
