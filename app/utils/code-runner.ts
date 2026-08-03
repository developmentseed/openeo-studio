import { PyodideAPI } from 'pyodide';
import loaderScript from '../algorithms/base/loader.py?raw';
import trueColorAlgorithm from '../algorithms/visualizations/true-color.py?raw';

import {
  type ExecutionConfig,
  type GraphResult,
  type ServiceInfo,
  type ValidationError,
  type BackendService
} from '$types';

import { appConfig } from '$config/runtime';
import { getInstanceId } from './instance-id';

export type ExecutionResult = {
  graphs: GraphResult[];
  services: ServiceInfo[];
};

// Track active services for cleanup
let activeServices: ServiceInfo[] = [];

export const EXAMPLE_CODE = trueColorAlgorithm;

// OpenEO API constants
const OPENEO_API_URL = appConfig.openeoApiUrl;
const AUTH_PREFIX = 'Bearer oidc/oidc/';

// Service title conventions for backend-side discovery
const EPHEMERAL_TITLE_PREFIX = 'openeo-studio:ephemeral:';
const PERMANENT_TITLE_PREFIX = 'openeo-studio:permanent:';

/**
 * Returns the management URL for a service given its id.
 * The openEO API uses the path structure: /services/{id}
 */
export function getServiceUrl(serviceId: string): string {
  return `${OPENEO_API_URL}/services/${serviceId}`;
}

const DEFAULT_SERVICE_CONFIG = {
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
 * @param options - Service creation options (title, scope)
 * @returns The service location URL from the response header
 */
async function createOpenEOService(
  graphResult: GraphResult,
  authToken: string,
  options: {
    title: string;
    scope?: 'public' | 'private';
    extent?: [number, number, number, number];
    layerName?: string;
  }
): Promise<string> {
  const { title, scope = 'public', extent, layerName } = options;

  const response = await fetch(`${OPENEO_API_URL}/services`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `${AUTH_PREFIX}${authToken}`
    },
    body: JSON.stringify({
      ...DEFAULT_SERVICE_CONFIG,
      title,
      configuration: {
        ...DEFAULT_SERVICE_CONFIG.configuration,
        scope,
        ...(extent ? { extent } : {}),
        ...(layerName ? { layerName } : {})
      },
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
export async function deleteOpenEOService(
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
  activeServices = [];
}

/**
 * Lists all services owned by the authenticated user from the openEO backend.
 *
 * @param authToken - Authentication token
 * @returns Array of backend service records
 */
export async function listOpenEOServices(
  authToken: string
): Promise<BackendService[]> {
  const response = await fetch(`${OPENEO_API_URL}/services`, {
    headers: {
      Authorization: `${AUTH_PREFIX}${authToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to list services (${response.status})`);
  }

  const payload = (await response.json()) as { services: BackendService[] };
  return payload.services ?? [];
}

/**
 * Discovers and deletes orphaned ephemeral services from previous sessions
 * belonging to this studio instance. Errors are logged but never block execution.
 *
 * @param authToken - Authentication token
 * @param instanceId - The studio instance UUID (from getInstanceId())
 */
export async function cleanupOrphanedServices(
  authToken: string,
  instanceId: string
): Promise<void> {
  try {
    const services = await listOpenEOServices(authToken);
    const prefix = `${EPHEMERAL_TITLE_PREFIX}${instanceId}`;
    const orphans = services.filter((s) => s.title === prefix);

    const deletePromises = orphans.map((s) =>
      deleteOpenEOService(getServiceUrl(s.id), authToken)
    );
    await Promise.allSettled(deletePromises);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Error cleaning up orphaned services:', error);
  }
}

/**
 * Creates a permanent (never auto-cleaned) XYZ service from a process graph.
 *
 * @param graphResult - The process graph and parameters
 * @param authToken - Authentication token
 * @param scope - Service visibility scope ('public' or 'private')
 * @returns The created service record from the backend
 */
export async function createPermanentService(
  graphResult: GraphResult,
  authToken: string,
  scope: 'public' | 'private' = 'public',
  extent?: [number, number, number, number]
): Promise<BackendService> {
  const serviceUUID = crypto.randomUUID();
  const title = `${PERMANENT_TITLE_PREFIX}${serviceUUID}`;
  const location = await createOpenEOService(graphResult, authToken, {
    title,
    scope,
    extent,
    layerName: graphResult.name
  });

  // Fetch the full service record from the backend
  const response = await fetch(location, {
    headers: {
      Authorization: `${AUTH_PREFIX}${authToken}`
    }
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch created permanent service (${response.status})`
    );
  }

  return (await response.json()) as BackendService;
}

/**
 * Lists all permanent services created by openEO Studio for the authenticated user.
 *
 * @param authToken - Authentication token
 * @returns Array of backend service records matching the permanent title prefix
 */
export async function listPermanentServices(
  authToken: string
): Promise<BackendService[]> {
  const services = await listOpenEOServices(authToken);
  return services.filter((s) => s.title?.startsWith(PERMANENT_TITLE_PREFIX));
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
 * Runs the Python program via Pyodide and returns the parsed map_graphs array.
 *
 * @param pyodide - The Pyodide instance
 * @param script - The algorithm script to execute
 * @param config - Execution configuration
 * @returns The parsed array of graph results (may be empty)
 */
async function runAlgorithm(
  pyodide: PyodideAPI,
  script: string,
  config: ExecutionConfig
): Promise<GraphResult[]> {
  const result = await pyodide.runPythonAsync(getPythonCode(script, config));
  const mapGraphs: GraphResult[] = JSON.parse(result);

  if (!Array.isArray(mapGraphs)) {
    throw new Error('Expected map_graphs array from Python execution');
  }

  return mapGraphs;
}

/**
 * Validates every graph against the openEO backend, throwing on the first
 * graph that fails validation.
 *
 * @param graphs - The graph results to validate
 * @param authToken - Authentication token
 */
async function validateGraphs(
  graphs: GraphResult[],
  authToken: string
): Promise<void> {
  for (const [index, graphResult] of graphs.entries()) {
    const errors = await validateProcessGraph(graphResult, authToken);
    if (errors.length > 0) {
      const formattedErrors = formatValidationErrors(errors);
      throw new Error(
        `Validation failed for graph ${index + 1}:\n${formattedErrors}`
      );
    }
  }
}

/**
 * Creates one ephemeral XYZ service per graph, resolves its tile URL, and
 * registers it for later cleanup.
 *
 * @param graphs - The graph results to create services for
 * @param authToken - Authentication token
 * @param instanceId - The studio instance UUID
 * @returns Array of ServiceInfo objects for map rendering
 */
async function createEphemeralServices(
  graphs: GraphResult[],
  authToken: string,
  instanceId: string
): Promise<ServiceInfo[]> {
  const ephemeralTitle = `${EPHEMERAL_TITLE_PREFIX}${instanceId}`;
  const services: ServiceInfo[] = [];

  for (const graphResult of graphs) {
    const serviceLocation = await createOpenEOService(graphResult, authToken, {
      title: ephemeralTitle
    });
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

/**
 * Executes a Python script with Pyodide and creates OpenEO services for the
 * graphs it produces.
 *
 * The algorithm is run and validated *before* the previous ephemeral services
 * are cleaned up, so a failed run leaves the currently rendered map intact.
 *
 * @param pyodide - The Pyodide instance
 * @param authToken - Authentication token
 * @param script - The Python script to execute
 * @param config - Execution configuration
 * @returns The produced graphs and their map services (both empty when the
 *   script adds no graphs to the map)
 */
export async function processScript(
  pyodide: PyodideAPI,
  authToken: string,
  script: string,
  config: ExecutionConfig
): Promise<ExecutionResult> {
  // Run + validate first, so a failed run does not delete the services the
  // current map is still displaying.
  const graphs = await runAlgorithm(pyodide, script, config);
  await validateGraphs(graphs, authToken);

  // Only now clean up the previous ephemeral services (and orphans from prior
  // sessions) — we have a valid new result to replace them with.
  await cleanupServices(authToken);
  const instanceId = getInstanceId();
  await cleanupOrphanedServices(authToken, instanceId);

  if (graphs.length === 0) {
    return { graphs: [], services: [] };
  }

  const services = await createEphemeralServices(graphs, authToken, instanceId);
  return { graphs, services };
}
