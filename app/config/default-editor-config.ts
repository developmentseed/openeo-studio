export type EditorConfigValues = {
  collectionId: string;
  temporalRange: [string, string];
  cloudCover: number;
  selectedBands: string[];
  boundingBox?: [number, number, number, number];
};

export const DEFAULT_EDITOR_CONFIG: EditorConfigValues = {
  collectionId: 'sentinel-2-l2a',
  temporalRange: ['', ''],
  cloudCover: 50,
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
