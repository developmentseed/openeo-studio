/**
 * Permanent (studio-managed) openEO XYZ services.
 * Never touches ephemeral session state.
 */

import type { BackendService, GraphResult } from '$types';
import { fetchJson } from '../api';
import { isPermanentTitle, permanentTitleFor } from './service-titles';
import { createOpenEOService, listOpenEOServices } from './services';

/**
 * Creates a permanent (never auto-cleaned) XYZ service from a process graph.
 */
export async function createPermanentService(
  graphResult: GraphResult,
  authToken: string,
  scope: 'public' | 'private' = 'public',
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
 * Lists all permanent services created by openEO Studio for the authenticated user.
 */
export async function listPermanentServices(
  authToken: string
): Promise<BackendService[]> {
  const services = await listOpenEOServices(authToken);
  return services.filter((s) => isPermanentTitle(s.title));
}
