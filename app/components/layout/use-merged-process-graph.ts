import { useMemo } from 'react';

import type { ServiceInfo } from '$types';
import type { ProcessGraph } from '$types/openeo-process';
import { mergeProcessGraphs } from '$utils/process-graphs';

/**
 * Merges every layer's process graph into the single graph shown by both the
 * JSON and Visual tabs. Returns null when there is nothing to show, including
 * when the graphs cannot be merged — neither tab should break the map panel
 * over a malformed graph.
 */
export function useMergedProcessGraph(
  services: ServiceInfo[]
): ProcessGraph | null {
  return useMemo(() => {
    if (services.length === 0) return null;
    try {
      return mergeProcessGraphs(
        services.map((service) => service.graphResult.process_graph)
      );
    } catch {
      return null;
    }
  }, [services]);
}
