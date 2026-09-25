import type { BackendService, ServiceInfo } from '$types';
import { getServiceUrl } from '$utils/openeo/services';

export function getServiceDisplayName(service: BackendService): string {
  return (
    (typeof service.configuration?.layerName === 'string' &&
      service.configuration.layerName) ||
    service.title
  );
}

export function decodeServiceUrl(url: string): string {
  try {
    return decodeURIComponent(url);
  } catch {
    return url;
  }
}

export function getServiceExtent(
  service: BackendService,
  fallback?: [number, number, number, number]
): [number, number, number, number] | undefined {
  const extent = service.configuration?.extent;
  if (
    Array.isArray(extent) &&
    extent.length === 4 &&
    extent.every((v) => typeof v === 'number')
  ) {
    return extent as [number, number, number, number];
  }
  return fallback;
}

export function backendServiceToServiceInfo(
  service: BackendService,
  visible: boolean,
  fallbackName?: string
): ServiceInfo {
  const name = getServiceDisplayName(service) || fallbackName || service.title;

  return {
    id: service.id,
    location: getServiceUrl(service.id),
    tileUrl: decodeServiceUrl(service.url),
    visible,
    graphResult: {
      name,
      process_graph: {},
      parameters: [],
      visible
    }
  };
}
