import { PyodideAPI } from 'pyodide';
import loaderScript from '../algorithms/base/loader.py?raw';
import trueColorAlgorithm from '../algorithms/visualizations/true-color.py?raw';
import {
  type ExecutionConfig,
  type GraphResult,
  type ServiceInfo
} from './template-renderer';

// Track active services for cleanup
const activeServices: ServiceInfo[] = [];

export const EXAMPLE_CODE = trueColorAlgorithm;

// OpenEO API constants
const OPENEO_API_URL = 'https://api.explorer.eopf.copernicus.eu/openeo';
const AUTH_PREFIX = 'Bearer oidc/oidc/';
const DEFAULT_SERVICE_CONFIG = {
  title: 'OpenEO Studio Ephemeral Service',
  description: null,
  type: 'XYZ',
  enabled: true,
  configuration: {
    scope: 'public'
  },
  plan: null,
  budget: null
};

/**
 * Combines the base loader script with an algorithm script to create
 * a complete Python program for execution.
 *
 * @param algorithmScript - The algorithm code to combine with the loader
 * @param config - Execution configuration with runtime parameters
 */
function getPythonCode(algorithmScript: string, config: ExecutionConfig) {
  // Inject scene defaults as a Python dictionary for parameter initialization
  const sceneDefaults = {
    collectionId: config.collectionId,
    selectedBands: config.selectedBands || [],
    temporalRange: config.temporalRange || [],
    ...config.parameterDefaults
  };

  const sceneDefaultsCode = `SCENE_DEFAULTS = ${JSON.stringify(sceneDefaults)}`;

  return `${sceneDefaultsCode}

${loaderScript}

${algorithmScript}

# Output map_graphs for service creation
json.dumps(map_graphs)
`;
}

/**
 * Creates an OpenEO service with the provided process graph and parameters.
 *
 * @param graphResult - The process graph and parameters from map_graphs
 * @param authToken - Authentication token
 * @returns The service location URL from the response header
 */
async function createOpenEOService(
  graphResult: GraphResult,
  authToken: string
): Promise<string> {
  const response = await fetch(`${OPENEO_API_URL}/services`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `${AUTH_PREFIX}${authToken}`
    },
    body: JSON.stringify({
      ...DEFAULT_SERVICE_CONFIG,
      process: {
        process_graph: graphResult.process_graph,
        parameters: graphResult.parameters
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to create service (${response.status}): ${errorText}`
    );
  }

  const location = response.headers.get('location');
  if (!location) {
    throw new Error('No location header in response');
  }

  return location;
}

/**
 * Deletes an OpenEO service.
 *
 * @param serviceLocation - The service location URL
 * @param authToken - Authentication token
 */
async function deleteOpenEOService(
  serviceLocation: string,
  authToken: string
): Promise<void> {
  try {
    const response = await fetch(serviceLocation, {
      method: 'DELETE',
      headers: {
        Authorization: `${AUTH_PREFIX}${authToken}`
      }
    });

    if (!response.ok) {
      // eslint-disable-next-line no-console
      console.warn(
        `Failed to delete service ${serviceLocation}: ${response.status}`
      );
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Error deleting service:', error);
  }
}

/**
 * Cleans up all active ephemeral services.
 *
 * @param authToken - Authentication token
 */
export async function cleanupServices(authToken: string): Promise<void> {
  const deletePromises = activeServices.map((service) =>
    deleteOpenEOService(service.location, authToken)
  );

  await Promise.allSettled(deletePromises);
  activeServices.length = 0; // Clear the array
}

/**
 * Fetches the tile URL from an OpenEO service location.
 *
 * @param serviceLocation - The service location URL
 * @param authToken - Authentication token
 * @returns The tile URL for map rendering
 */
async function getTileUrl(
  serviceLocation: string,
  authToken: string
): Promise<string> {
  const response = await fetch(serviceLocation, {
    headers: {
      Authorization: `${AUTH_PREFIX}${authToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch service details (${response.status})`);
  }

  const tileJson = await response.json();
  return tileJson.url;
}

/**
 * Executes a Python script with Pyodide and creates OpenEO services for multiple graphs.
 *
 * @param pyodide - The Pyodide instance
 * @param authToken - Authentication token
 * @param script - The Python script to execute
 * @param config - Execution configuration
 * @returns Array of ServiceInfo objects for map rendering, or undefined on error
 */
export async function processScript(
  pyodide: PyodideAPI,
  authToken: string,
  script: string,
  config: ExecutionConfig
): Promise<ServiceInfo[] | undefined> {
  try {
    // Clean up previous services before creating new ones
    await cleanupServices(authToken);

    // Execute Python code and get map_graphs array
    const result = await pyodide.runPythonAsync(getPythonCode(script, config));
    const mapGraphs: GraphResult[] = JSON.parse(result);

    if (!Array.isArray(mapGraphs)) {
      throw new Error('Expected map_graphs array from Python execution');
    }

    // Create services for each graph
    const services: ServiceInfo[] = [];

    for (const graphResult of mapGraphs) {
      const serviceLocation = await createOpenEOService(graphResult, authToken);
      const tileUrl = await getTileUrl(serviceLocation, authToken);

      const serviceInfo: ServiceInfo = {
        id: crypto.randomUUID(),
        location: serviceLocation,
        tileUrl,
        graphResult
      };

      services.push(serviceInfo);
      activeServices.push(serviceInfo);
    }

    return services;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error executing Python code:', error);
    return undefined;
  }
}
