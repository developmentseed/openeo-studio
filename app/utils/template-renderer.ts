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
    boundingBox?: [number, number, number, number];
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
  name: string;
  visible: boolean;
}

/**
 * Service tracking information for ephemeral service management.
 */
export interface ServiceInfo {
  id: string;
  location: string;
  tileUrl: string;
  graphResult: GraphResult;
  visible: boolean;
}
