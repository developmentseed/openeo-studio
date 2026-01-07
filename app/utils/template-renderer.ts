import type { BandVariable } from './stac-band-parser';

/**
 * Runtime execution configuration for Python script parameter injection.
 * Derived from Scene configuration, STAC metadata, and user selections.
 */
export interface ExecutionConfig {
  /** Collection identifier for the data source */
  collectionId: string;
  /** Available band variables from STAC metadata */
  bands?: BandVariable[];
  /** User-selected bands in order for data[] array */
  selectedBands?: string[];
  /** Temporal range for data loading */
  temporalRange?: string[];
  /** Parameter defaults from scene configuration */
  parameterDefaults?: {
    bbox?: [number, number, number, number];
    cloudCover?: number;
    [key: string]: unknown;
  };
}

/**
 * Result structure for multi-graph output from Python execution.
 * Contains multiple process graphs with their parameter metadata.
 */
export interface GraphResult {
  process_graph: unknown;
  parameters: unknown[];
}

/**
 * Service tracking information for ephemeral service management.
 */
export interface ServiceInfo {
  id: string;
  location: string;
  tileUrl: string;
  graphResult: GraphResult;
}

/**
 * Legacy template rendering function - deprecated.
 * Use parameter injection through SCENE_DEFAULTS in code-runner.ts instead.
 *
 * @deprecated This function is no longer used with the new parameter system
 */
export function renderPythonTemplate(
  template: string,
  _config: ExecutionConfig
): string {
  // eslint-disable-next-line no-console
  console.warn(
    'renderPythonTemplate is deprecated - use SCENE_DEFAULTS injection instead'
  );
  return template;
}
