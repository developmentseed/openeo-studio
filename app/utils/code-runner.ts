/**
 * Pyodide algorithm execution orchestrator.
 * openEO service/validation helpers live under `$utils/openeo/`.
 */

import type { PyodideAPI } from 'pyodide';
import loaderScript from '../algorithms/base/loader.py?raw';
import trueColorAlgorithm from '../algorithms/visualizations/true-color.py?raw';

import type { ExecutionConfig, GraphResult, ServiceInfo } from '$types';

import { appConfig } from '$config/runtime';

import { fetchJson } from './api';
import { getInstanceId } from './instance-id';
import {
  cleanupOrphanedServices,
  cleanupServices,
  createEphemeralServices
} from './openeo/ephemeral-services';
import { validateGraphs } from './openeo/validation';

export const EXAMPLE_CODE = trueColorAlgorithm;

type CubeDimensions = Record<string, { type?: string; values?: unknown }>;

/**
 * The collection's datacube dimensions with the bands narrowed to the
 * configured ones, in order: what load_collection loads. Null when the backend
 * does not describe them, and the loader then runs without metadata, as it
 * always did.
 */
async function loadedDimensions(
  config: ExecutionConfig,
  authToken: string
): Promise<CubeDimensions | null> {
  try {
    const collection = await fetchJson<{ 'cube:dimensions'?: CubeDimensions }>(
      `${appConfig.openeoApiUrl}/collections/${encodeURIComponent(config.collectionId)}`,
      authToken
    );
    const dimensions = collection?.['cube:dimensions'];
    if (!dimensions) return null;
    return Object.fromEntries(
      Object.entries(dimensions).map(([name, dimension]) => [
        name,
        dimension.type === 'bands'
          ? { ...dimension, values: config.selectedBands ?? [] }
          : dimension
      ])
    );
  } catch {
    return null;
  }
}

/**
 * Combines the base loader script with an algorithm script to create
 * a complete Python program for execution.
 */
function getPythonCode(
  algorithmScript: string,
  config: ExecutionConfig,
  cubeDimensions: CubeDimensions | null
) {
  // Inject the user-selected run configuration for parameter initialization
  // Normalize bounding box from array [west, south, east, north] to object form
  const boundingBox = Array.isArray(config.boundingBox)
    ? {
        west: config.boundingBox[0],
        south: config.boundingBox[1],
        east: config.boundingBox[2],
        north: config.boundingBox[3]
      }
    : config.boundingBox;

  const runConfig = {
    collectionId: config.collectionId,
    bands: config.selectedBands || [],
    time: config.temporalRange || [],
    boundingBox,
    propertyFilters: config.propertyFilters || [],
    cubeDimensions,
    ...(config.algorithmParams || {})
  };

  // Parse the configuration as JSON: a JSON literal is not always valid
  // Python (`true`, `false` and `null` are not).
  const runConfigCode = `import json
RUN_CONFIG = json.loads(${JSON.stringify(JSON.stringify(runConfig))})`;

  return `${runConfigCode}

${loaderScript}

${algorithmScript}

# Output map_graphs for service creation
json.dumps(map_graphs)
`;
}

/**
 * Runs the Python program via Pyodide and returns the parsed map_graphs array.
 */
async function runAlgorithm(
  pyodide: PyodideAPI,
  script: string,
  config: ExecutionConfig,
  authToken: string
): Promise<GraphResult[]> {
  const dimensions = await loadedDimensions(config, authToken);
  const result = await pyodide.runPythonAsync(
    getPythonCode(script, config, dimensions)
  );
  const mapGraphs: GraphResult[] = JSON.parse(result);

  if (!Array.isArray(mapGraphs)) {
    throw new Error('Expected map_graphs array from Python execution');
  }

  return mapGraphs;
}

/**
 * Runs a Python script with Pyodide and validates every resulting graph against
 * the openEO backend.
 *
 * The algorithm is run and validated *before* services are replaced, so a failed
 * run leaves the currently rendered map intact.
 *
 * @returns The produced graphs (empty when the script adds none to the map)
 */
export async function runAndValidateScript(
  pyodide: PyodideAPI,
  authToken: string,
  script: string,
  config: ExecutionConfig,
  onGraphs?: (graphs: GraphResult[]) => void
): Promise<GraphResult[]> {
  const graphs = await runAlgorithm(pyodide, script, config, authToken);
  // Before validation, so a graph the backend refuses can still be inspected.
  onGraphs?.(graphs);
  await validateGraphs(graphs, authToken);
  return graphs;
}

/**
 * Replaces the current ephemeral map services with ones built from `graphs`.
 * Cleans up previous (and orphaned) services first; returns [] when there are
 * no graphs.
 */
export async function createServicesFromGraphs(
  graphs: GraphResult[],
  authToken: string
): Promise<ServiceInfo[]> {
  await cleanupServices(authToken);
  const instanceId = getInstanceId();
  await cleanupOrphanedServices(authToken, instanceId);

  if (graphs.length === 0) {
    return [];
  }

  return createEphemeralServices(graphs, authToken, instanceId);
}
