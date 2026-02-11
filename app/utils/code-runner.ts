import { PyodideAPI } from 'pyodide';
import loaderScript from '../algorithms/base/loader.py?raw';
import trueColorAlgorithm from '../algorithms/visualizations/true-color.py?raw';

import {
  type ExecutionConfig,
  type GraphResult,
  type ServiceInfo,
  type ValidationError
} from '$types';

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
    scope: 'public',
    minZoom: 6,
    maxZoom: 15
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
    cloudCover: config.cloudCover,
    ...(config.algorithmParams || {})
  };

  const runConfigCode = `RUN_CONFIG = ${JSON.stringify(runConfig)}`;

  return `${runConfigCode}

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

function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) return 'Unknown validation error.';

  return errors
    .map((error) => {
      const code = error.code ? `${error.code}: ` : '';
      const path = error.path ? ` (${error.path})` : '';
      const message = error.message || 'Validation error.';
      return `${code}${message}${path}`;
    })
    .join('\n');
}

async function validateProcessGraph(
  graphResult: GraphResult,
  authToken: string
): Promise<ValidationError[]> {
  const response = await fetch(`${OPENEO_API_URL}/validation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `${AUTH_PREFIX}${authToken}`
    },
    body: JSON.stringify({
      process_graph: graphResult.process_graph,
      parameters: graphResult.parameters
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Validation request failed (${response.status}): ${errorText}`
    );
  }

  const payload = (await response.json()) as { errors?: ValidationError[] };
  return Array.isArray(payload.errors) ? payload.errors : [];
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
  // Clean up previous services before creating new ones
  await cleanupServices(authToken);

  // Execute Python code and get map_graphs array
  const result = await pyodide.runPythonAsync(getPythonCode(script, config));
  const mapGraphs: GraphResult[] = JSON.parse(result);

  if (!Array.isArray(mapGraphs)) {
    throw new Error('Expected map_graphs array from Python execution');
  }

  // Validate all graphs before creating services
  for (const [index, graphResult] of mapGraphs.entries()) {
    const errors = await validateProcessGraph(graphResult, authToken);
    if (errors.length > 0) {
      const formattedErrors = formatValidationErrors(errors);
      throw new Error(
        `Validation failed for graph ${index + 1}:\n${formattedErrors}`
      );
    }
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
      graphResult,
      visible: graphResult.visible
    };

    services.push(serviceInfo);
    activeServices.push(serviceInfo);
  }

  return services;
}
