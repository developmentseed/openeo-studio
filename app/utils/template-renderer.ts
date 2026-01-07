import Handlebars from 'handlebars';
import type { BandVariable } from './stac-band-parser';

/**
 * Runtime execution configuration for Python script template variables.
 * Derived from Scene/STAC metadata.
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
 *   collectionId: 'sentinel-2-l2a'
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
