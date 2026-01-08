/**
 * Sample configuration for quick-starting analysis.
 */
export interface SampleScene {
  id: string;
  name: string;
  description: string;
  thumbnailUrl?: string;
  collectionId: string;
  temporalRange?: string[];

  suggestedAlgorithm: string;
  /** Default bands for this algorithm (e.g., ['b02', 'b03', 'b04']) */
  defaultBands: string[];
  /** Default parameter values for algorithm execution */
  parameterDefaults: {
    boundingBox: { west: number; south: number; east: number; north: number }; // Object format - now mandatory
    cloudCover?: number;
    [key: string]: unknown; // Additional algorithm-specific parameters
  };
}

/**
 * Represents a band variable extracted from STAC metadata.
 */
export interface BandVariable {
  /** Variable name (e.g., "B02") */
  variable: string;
  /** Band identifier in lowercase (e.g., "b02") */
  name: string;
  /** Human-readable label (e.g., "Blue") */
  label: string;
  /** Common name from EO extension (e.g., "blue") */
  commonName?: string;
  /** Spatial resolution (e.g., "10m") */
  resolution?: string;
  /** Center wavelength (e.g., "490 nm") */
  wavelength?: string;
  /** Full path for datacube.band() (e.g., "reflectance|b02") */
  path: string;
}

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
