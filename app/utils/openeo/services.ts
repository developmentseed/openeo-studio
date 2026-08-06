/**
 * Low-level openEO /services HTTP helpers.
 * No module-level session state — ephemeral lifecycle lives elsewhere.
 */

import { appConfig } from '$config/runtime';
import type { BackendService, GraphResult } from '$types';
import { fetchJson, fetchHeaderLocation } from '../api';

const OPENEO_API_URL = appConfig.openeoApiUrl;

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
 * Returns the management URL for a service given its id.
 * The openEO API uses the path structure: /services/{id}
 */
export function getServiceUrl(serviceId: string): string {
  return `${OPENEO_API_URL}/services/${serviceId}`;
}

/**
 * Creates an OpenEO service with the provided process graph and parameters.
 *
 * @returns The service location URL from the response header
 */
export async function createOpenEOService(
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

  return fetchHeaderLocation(`${OPENEO_API_URL}/services`, authToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
}

/**
 * Soft-fail delete for cleanup paths. Errors are logged and never thrown.
 */
export async function deleteOpenEOService(
  serviceLocation: string,
  authToken: string
): Promise<void> {
  try {
    await fetchJson(serviceLocation, authToken, { method: 'DELETE' });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`Failed to delete service ${serviceLocation}:`, error);
  }
}

/**
 * Lists all services owned by the authenticated user from the openEO backend.
 */
export async function listOpenEOServices(
  authToken: string
): Promise<BackendService[]> {
  const payload = await fetchJson<{ services?: BackendService[] }>(
    `${OPENEO_API_URL}/services`,
    authToken
  );

  return payload?.services ?? [];
}

/**
 * Fetches the tile URL from an OpenEO service location.
 */
export async function getTileUrl(
  serviceLocation: string,
  authToken: string
): Promise<string> {
  const tileJson = await fetchJson<{ url: string }>(serviceLocation, authToken);
  return tileJson.url;
}
