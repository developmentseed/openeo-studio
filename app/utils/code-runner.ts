import { PyodideAPI } from 'pyodide';
import loaderScript from '../algorithms/base/loader.py?raw';
import trueColorAlgorithm from '../algorithms/visualizations/true-color.py?raw';
import {
  renderPythonTemplate,
  type ExecutionConfig
} from './template-renderer';

export const EXAMPLE_CODE = trueColorAlgorithm;

// OpenEO API constants
const OPENEO_API_URL = 'https://api.explorer.eopf.copernicus.eu/openeo';
const AUTH_PREFIX = 'Bearer oidc/oidc/';
const DEFAULT_SERVICE_CONFIG = {
  title: 'Quick view',
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
  const processedLoader = renderPythonTemplate(loaderScript, config);

  return `${processedLoader}

${algorithmScript}
`;
}

/**
 * Creates an OpenEO service with the provided process graph.
 *
 * @param graph - The OpenEO process graph JSON
 * @param authToken - Authentication token
 * @returns The service location URL from the response header
 */
async function createOpenEOService(
  graph: unknown,
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
      process: graph
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
 * Executes a Python script with Pyodide and creates an OpenEO service.
 *
 * @param pyodide - The Pyodide instance
 * @param authToken - Authentication token
 * @param script - The Python script to execute
 * @param config - Execution configuration
 * @returns The tile URL for map rendering, or undefined on error
 */
export async function processScript(
  pyodide: PyodideAPI,
  authToken: string,
  script: string,
  config: ExecutionConfig
): Promise<string | undefined> {
  try {
    // Execute Python code and get process graph
    const result = await pyodide.runPythonAsync(getPythonCode(script, config));
    const graph = JSON.parse(result);

    // Create OpenEO service and get tile URL
    const serviceLocation = await createOpenEOService(graph, authToken);
    const tileUrl = await getTileUrl(serviceLocation, authToken);

    return tileUrl;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error executing Python code:', error);
    return undefined;
  }
}
