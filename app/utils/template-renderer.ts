import Handlebars from 'handlebars';
import type { BandVariable } from './stac-band-parser';

/**
 * Runtime execution configuration for Python script template variables.
 * Derived from Scene/STAC metadata.
 */
export interface ExecutionConfig {
  /** S3 URL to the Zarr data store */
  sceneUrl: string;
  /** Available band variables from STAC metadata */
  bands?: BandVariable[];
  // Future additions:
  // resolution?: number;
  // bbox?: [number, number, number, number];
}

/**
 * Compiles and renders a Python script template with the provided configuration.
 * Uses Handlebars for safe, maintainable template rendering.
 *
 * @param template - The Python script template string (e.g., from loader.py)
 * @param config - Execution configuration with runtime parameters
 * @returns Rendered Python script with variables replaced
 *
 * @example
 * ```typescript
 * const rendered = renderPythonTemplate(loaderScript, {
 *   sceneUrl: 's3://bucket/path/to/data.zarr'
 * });
 * ```
 */
export function renderPythonTemplate(
  template: string,
  config: ExecutionConfig
): string {
  const compiledTemplate = Handlebars.compile(template, {
    noEscape: true, // Don't HTML-escape, we're generating Python
    strict: true // Throw on undefined variables
  });

  return compiledTemplate(config);
}
