import { useEffect, type RefObject } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';

import { parseTileError, readAjaxError, type TileError } from './tile-error';

export type TileLoadStatus = {
  pending: number;
  status: 'idle' | 'loading' | 'warning' | 'error';
  /** The last tile error of the current view, when status is 'error'. */
  error?: TileError;
  /** The number of tiles that failed in the current view. */
  failed?: number;
};

interface UseMapTileStatusOptions {
  mapRef: RefObject<MapRef | null>;
  isMapReady: boolean;
  serviceCount: number;
  /** The ids of the services. A new run starts with no tile error. */
  serviceKey?: string;
  onStatusChange?: (status: TileLoadStatus) => void;
}

export function useMapTileStatus({
  mapRef,
  isMapReady,
  serviceCount,
  serviceKey,
  onStatusChange
}: UseMapTileStatusOptions) {
  useEffect(() => {
    if (!isMapReady || !onStatusChange || serviceCount === 0) return;
    const map = mapRef.current;
    if (!map) return;

    let lastStatus: TileLoadStatus = { pending: 0, status: 'idle' };
    let pendingCount = 0;
    let warningTimer: number | undefined;
    // The tile errors of the current view. A move starts a new view.
    let lastError: TileError | undefined;
    let failedCount = 0;
    let disposed = false;

    const updateStatus = (
      pending: number,
      status: TileLoadStatus['status']
    ) => {
      if (
        lastStatus.pending !== pending ||
        lastStatus.status !== status ||
        lastStatus.failed !== failedCount
      ) {
        lastStatus =
          status === 'error'
            ? { pending, status, error: lastError, failed: failedCount }
            : { pending, status };
        onStatusChange(lastStatus);
      }
    };

    // A tile error in this view wins over 'loading' and 'idle'. MapLibre
    // fires 'sourcedataloading' more often than it loads tiles, so the
    // pending count is not exact, and one failed tile is enough to show
    // that the area or the dates need a change.
    const statusFor = (pending: number): TileLoadStatus['status'] =>
      lastError ? 'error' : pending > 0 ? 'loading' : 'idle';

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

    const handleSourceDataLoading = (event: { sourceId?: string }) => {
      if (!event.sourceId?.startsWith('service-')) return;
      pendingCount++;
      updateStatus(pendingCount, statusFor(pendingCount));
      startWarningTimer();
    };

    const handleSourceData = (event: { sourceId?: string }) => {
      if (!event.sourceId?.startsWith('service-')) return;
      if (pendingCount > 0) pendingCount--;
      clearTimer();

      updateStatus(pendingCount, statusFor(pendingCount));
      if (pendingCount > 0) startWarningTimer();
    };

    // A failed tile fires 'error', not 'sourcedata'. Without this handler the
    // tile stays pending and the status stays 'loading'.
    const handleError = (event: { sourceId?: string; error?: unknown }) => {
      if (!event.sourceId?.startsWith('service-')) return;
      if (pendingCount > 0) pendingCount--;
      failedCount++;
      void readAjaxError(event.error).then((response) => {
        if (disposed) return;
        lastError = response
          ? parseTileError(response.status, response.body)
          : {
              code: 'TileError',
              message: String(
                (event.error as Error | undefined)?.message ?? event.error
              ),
              advice: ''
            };
        clearTimer();
        updateStatus(pendingCount, 'error');
      });
    };

    const handleMoveStart = () => {
      pendingCount = 0;
      lastError = undefined;
      failedCount = 0;
      updateStatus(0, 'loading');
      startWarningTimer();
    };

    const handleIdle = () => {
      pendingCount = 0;
      clearTimer();
      updateStatus(0, statusFor(0));
    };

    map.on('movestart', handleMoveStart);
    map.on('sourcedataloading', handleSourceDataLoading);
    map.on('sourcedata', handleSourceData);
    map.on('idle', handleIdle);
    map.on('error', handleError);

    return () => {
      disposed = true;
      clearTimer();
      map.off('error', handleError);
      map.off('movestart', handleMoveStart);
      map.off('sourcedataloading', handleSourceDataLoading);
      map.off('sourcedata', handleSourceData);
      map.off('idle', handleIdle);
    };
  }, [isMapReady, mapRef, onStatusChange, serviceCount, serviceKey]);
}
