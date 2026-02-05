import { useEffect, type RefObject } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';

export type TileLoadStatus = {
  pending: number;
  status: 'idle' | 'loading' | 'warning';
};

interface UseMapTileStatusOptions {
  mapRef: RefObject<MapRef | null>;
  isMapReady: boolean;
  serviceCount: number;
  onStatusChange?: (status: TileLoadStatus) => void;
}

export function useMapTileStatus({
  mapRef,
  isMapReady,
  serviceCount,
  onStatusChange
}: UseMapTileStatusOptions) {
  useEffect(() => {
    if (!isMapReady || !onStatusChange || serviceCount === 0) return;
    const map = mapRef.current;
    if (!map) return;

    let lastStatus = { pending: 0, status: 'idle' as TileLoadStatus['status'] };
    let pendingCount = 0;
    let warningTimer: number | undefined;

    const updateStatus = (
      pending: number,
      status: TileLoadStatus['status']
    ) => {
      if (lastStatus.pending !== pending || lastStatus.status !== status) {
        lastStatus = { pending, status };
        onStatusChange({ pending, status });
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

    const handleSourceDataLoading = (event: { sourceId?: string }) => {
      if (!event.sourceId?.startsWith('service-')) return;
      pendingCount++;
      updateStatus(pendingCount, 'loading');
      startWarningTimer();
    };

    const handleSourceData = (event: { sourceId?: string }) => {
      if (!event.sourceId?.startsWith('service-')) return;
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
      pendingCount = 0;
      updateStatus(0, 'loading');
      startWarningTimer();
    };

    const handleIdle = () => {
      pendingCount = 0;
      clearTimer();
      updateStatus(0, 'idle');
    };

    map.on('movestart', handleMoveStart);
    map.on('sourcedataloading', handleSourceDataLoading);
    map.on('sourcedata', handleSourceData);
    map.on('idle', handleIdle);

    return () => {
      clearTimer();
      map.off('movestart', handleMoveStart);
      map.off('sourcedataloading', handleSourceDataLoading);
      map.off('sourcedata', handleSourceData);
      map.off('idle', handleIdle);
    };
  }, [isMapReady, mapRef, onStatusChange, serviceCount]);
}
