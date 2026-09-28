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

let activeServices: ServiceInfo[] = [];

/**
 * Cleans up all active ephemeral services for this session.
 */
export async function cleanupServices(authToken: string): Promise<void> {
  const deletePromises = activeServices.map((service) =>
    deleteOpenEOService(service.location, authToken)
  );

  await Promise.allSettled(deletePromises);
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
