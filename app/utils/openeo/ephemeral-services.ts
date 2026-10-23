/**
 * Ephemeral openEO services for the current editor session.
 * Owns the in-memory activeServices registry.
 */

import type { GraphResult, ServiceInfo } from '$types';
import { ephemeralTitleFor } from './service-titles';
import {
  createOpenEOService,
  deleteOpenEOService,
  getServiceUrl,
  getTileUrl,
  listOpenEOServices
} from './services';

/** Max DELETEs in flight, so a backlog never reaches the backend as a burst. */
export const DELETE_CONCURRENCY = 4;

/** DELETEs per cleanup run; a larger backlog drains over later runs. */
export const MAX_DELETES_PER_RUN = 20;

let activeServices: ServiceInfo[] = [];

/**
 * Deletes up to MAX_DELETES_PER_RUN services, DELETE_CONCURRENCY at a time.
 * Stops after a batch with a refusal: the backend would likely refuse the
 * rest too, and the next run retries them. Never throws.
 */
async function deleteServices(
  locations: string[],
  authToken: string
): Promise<void> {
  const queue = locations.slice(0, MAX_DELETES_PER_RUN);
  for (let i = 0; i < queue.length; i += DELETE_CONCURRENCY) {
    const batch = queue.slice(i, i + DELETE_CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map((location) => deleteOpenEOService(location, authToken))
    );
    if (results.some((r) => r.status === 'rejected' || r.value === 'refused'))
      return;
  }
}

/**
 * Cleans up the active ephemeral services for this session. Any left behind
 * keep their ephemeral title, so cleanupOrphanedServices finds them later.
 */
export async function cleanupServices(authToken: string): Promise<void> {
  await deleteServices(
    activeServices.map((service) => service.location),
    authToken
  );
  activeServices = [];
}

/**
 * Discovers and deletes orphaned ephemeral services from previous sessions
 * belonging to this studio instance. Errors are logged but never block execution.
 */
export async function cleanupOrphanedServices(
  authToken: string,
  instanceId: string
): Promise<void> {
  try {
    const services = await listOpenEOServices(authToken);
    const prefix = ephemeralTitleFor(instanceId);
    const orphans = services.filter((s) => s.title === prefix);

    await deleteServices(
      orphans.map((s) => getServiceUrl(s.id)),
      authToken
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Error cleaning up orphaned services:', error);
  }
}

/**
 * Creates one ephemeral XYZ service per graph, resolves its tile URL, and
 * registers it for later cleanup.
 */
export async function createEphemeralServices(
  graphs: GraphResult[],
  authToken: string,
  instanceId: string
): Promise<ServiceInfo[]> {
  const ephemeralTitle = ephemeralTitleFor(instanceId);
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
