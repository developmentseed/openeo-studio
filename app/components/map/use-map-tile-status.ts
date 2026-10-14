import { useEffect, type RefObject } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';

export type TileErrorReason = 'no-data' | 'failed';

export type TileLoadStatus = {
  pending: number;
  status: 'idle' | 'loading' | 'warning' | 'error';
  reason?: TileErrorReason;
  message?: string;
};

export type TileError = {
  reason: TileErrorReason;
  message: string;
};

interface UseMapTileStatusOptions {
  mapRef: RefObject<MapRef | null>;
  isMapReady: boolean;
  // Changes when the displayed services change (e.g. joined service ids).
  serviceKey: string;
  onStatusChange?: (status: TileLoadStatus) => void;
}

// openEO error code the back-end returns (HTTP 404) when the AOI/TOI has no
// data.
const NO_DATA_CODE = 'NoDataAvailable';

/**
 * Converts a failed tile response ({ status, body }, the same shape as
 * MapLibre's AJAXError) or a network error into a reason and a message. The
 * openEO error body is JSON: { code, message }.
 */
export async function parseTileError(error: unknown): Promise<TileError> {
  const { status, body, message } = (error ?? {}) as {
    status?: number;
    body?: Blob;
    message?: string;
  };

  let payload: { code?: string; message?: string } | undefined;
  if (body && typeof body.text === 'function') {
    try {
      payload = JSON.parse(await body.text());
    } catch {
      payload = undefined;
    }
  }

  if (payload?.code === NO_DATA_CODE) {
    return {
      reason: 'no-data',
      message: payload.message ?? 'No data available.'
    };
  }

  return {
    reason: 'failed',
    message:
      payload?.message ??
      (status ? `HTTP ${status}` : message || 'Unknown error')
  };
}

const isServiceSource = (sourceId?: string) =>
  !!sourceId?.startsWith('service-');

export function useMapTileStatus({
  mapRef,
  isMapReady,
  serviceKey,
  onStatusChange
}: UseMapTileStatusOptions) {
  useEffect(() => {
    if (!isMapReady || !onStatusChange || !serviceKey) return;
    const map = mapRef.current;
    if (!map) return;

    let lastStatus: TileLoadStatus = { pending: 0, status: 'idle' };
    let pendingCount = 0;
    let warningTimer: number | undefined;
    let lastProbeId = 0;
    let isDisposed = false;

    const updateStatus = (
      pending: number,
      status: TileLoadStatus['status'],
      error?: TileError
    ) => {
      const next: TileLoadStatus = {
        pending,
        status,
        reason: error?.reason,
        message: error?.message
      };
      if (
        lastStatus.pending !== next.pending ||
        lastStatus.status !== next.status ||
        lastStatus.reason !== next.reason ||
        lastStatus.message !== next.message
      ) {
        lastStatus = next;
        onStatusChange(next);
      }
    };

    const clearTimer = () => {
      if (warningTimer) window.clearTimeout(warningTimer);
      warningTimer = undefined;
    };

    const startWarningTimer = () => {
      clearTimer();
      warningTimer = window.setTimeout(() => {
        if (pendingCount === 0 && lastStatus.status === 'loading') {
          updateStatus(0, 'warning');
        }
      }, 5000);
    };

    // `tileManagers` is typed in maplibre-gl 5 but is not documented API.
    const getServiceTileManagers = () =>
      Object.entries(map.getMap().style?.tileManagers ?? {}).filter(([id]) =>
        isServiceSource(id)
      );

    const hasRenderedServiceTiles = () =>
      getServiceTileManagers().some(
        ([, manager]) => manager.getRenderableIds().length > 0
      );

    const findErroredTileUrl = () => {
      for (const [, manager] of getServiceTileManagers()) {
        const source = manager.getSource() as {
          tiles?: string[];
          scheme?: string;
        };
        if (!source.tiles?.length) continue;
        for (const id of manager.getIds()) {
          const tile = manager.getTileByID(id);
          if (tile?.state === 'errored') {
            return tile.tileID.canonical.url(
              source.tiles,
              window.devicePixelRatio,
              source.scheme
            );
          }
        }
      }
      return undefined;
    };

    // MapLibre does not fire an error event for 404 tiles, and the openEO
    // back-end returns NoDataAvailable as a 404. So when no service tile
    // renders, fetch one errored tile again to read the error body.
    const probeTileError = async (url: string): Promise<TileError | null> => {
      try {
        const response = await fetch(url);
        if (response.ok) return null;
        return parseTileError({
          status: response.status,
          body: await response.blob()
        });
      } catch (error) {
        return parseTileError(error);
      }
    };

    const settle = () => {
      const probeId = ++lastProbeId;
      const erroredTileUrl = hasRenderedServiceTiles()
        ? undefined
        : findErroredTileUrl();

      if (!erroredTileUrl) {
        updateStatus(0, 'idle');
        return;
      }

      void probeTileError(erroredTileUrl).then((tileError) => {
        // Ignore the result if the map moved or the services changed.
        if (isDisposed || probeId !== lastProbeId) return;
        if (tileError) {
          updateStatus(0, 'error', tileError);
        } else {
          updateStatus(0, 'idle');
        }
      });
    };

    const handleSourceDataLoading = (event: { sourceId?: string }) => {
      if (!isServiceSource(event.sourceId)) return;
      lastProbeId++;
      pendingCount++;
      updateStatus(pendingCount, 'loading');
      startWarningTimer();
    };

    const handleSourceData = (event: { sourceId?: string }) => {
      if (!isServiceSource(event.sourceId)) return;
      if (pendingCount > 0) pendingCount--;
      clearTimer();

      if (pendingCount > 0) {
        updateStatus(pendingCount, 'loading');
        startWarningTimer();
      } else {
        updateStatus(0, 'idle');
      }
    };

    const handleMoveStart = () => {
      lastProbeId++;
      pendingCount = 0;
      updateStatus(0, 'loading');
      startWarningTimer();
    };

    const handleIdle = () => {
      pendingCount = 0;
      clearTimer();
      settle();
    };

    map.on('movestart', handleMoveStart);
    map.on('sourcedataloading', handleSourceDataLoading);
    map.on('sourcedata', handleSourceData);
    map.on('idle', handleIdle);

    return () => {
      isDisposed = true;
      clearTimer();
      map.off('movestart', handleMoveStart);
      map.off('sourcedataloading', handleSourceDataLoading);
      map.off('sourcedata', handleSourceData);
      map.off('idle', handleIdle);
    };
  }, [isMapReady, mapRef, onStatusChange, serviceKey]);
}
