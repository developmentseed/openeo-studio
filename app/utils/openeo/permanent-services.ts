/**
 * Permanent (studio-managed) openEO XYZ services.
 * Never touches ephemeral session state.
 */

import type { BackendService, GraphResult, ServiceScope } from '$types';
import { fetchJson } from '../api';
import { isPermanentTitle, permanentTitleFor } from './service-titles';
import {
  createOpenEOService,
  getServiceUrl,
  listOpenEOServices
} from './services';

/**
 * Creates a permanent (never auto-cleaned) XYZ service from a process graph.
 */
export async function createPermanentService(
  graphResult: GraphResult,
  authToken: string,
  scope: ServiceScope = 'public',
  extent?: [number, number, number, number]
): Promise<BackendService> {
  const serviceUUID = crypto.randomUUID();
  const title = permanentTitleFor(serviceUUID);
  const location = await createOpenEOService(graphResult, authToken, {
    title,
    scope,
    extent,
    layerName: graphResult.name
  });

  return fetchJson<BackendService>(location, authToken);
}

/**
 * Fetches a single service by id.
 */
export async function getPermanentService(
  serviceId: string,
  authToken?: string
): Promise<BackendService> {
  return fetchJson<BackendService>(getServiceUrl(serviceId), authToken);
}

/**
 * Deletes a permanent service by id.
 */
export async function deletePermanentService(
  serviceId: string,
  authToken: string
): Promise<void> {
  await fetchJson(getServiceUrl(serviceId), authToken, { method: 'DELETE' });
}

/**
 * Updates the scope (and any other configuration fields) of a permanent service.
 */
export async function updatePermanentServiceConfiguration(
  service: BackendService,
  authToken: string,
  configuration: Record<string, unknown>
): Promise<BackendService> {
  await fetchJson(getServiceUrl(service.id), authToken, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ configuration })
  });

  return { ...service, configuration };
}

/**
 * Lists all permanent services created by openEO Studio for the authenticated user.
 */
export async function listPermanentServices(
  authToken: string
): Promise<BackendService[]> {
  const services = await listOpenEOServices(authToken);
  return services.filter((s) => isPermanentTitle(s.title));
}
