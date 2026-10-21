import { renderHook, waitFor, act } from '@testing-library/react';
import type { RefObject } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';

import {
  useMapTileStatus,
  type TileLoadStatus
} from '$components/map/use-map-tile-status';

type Handler = (event: Record<string, unknown>) => void;

/** A map that only records handlers, so that the test can fire events. */
function fakeMap() {
  const handlers: Record<string, Handler[]> = {};
  const map = {
    on: (type: string, handler: Handler) => {
      (handlers[type] ??= []).push(handler);
    },
    off: (type: string, handler: Handler) => {
      handlers[type] = (handlers[type] ?? []).filter((h) => h !== handler);
    }
  };
  const fire = (type: string, event: Record<string, unknown> = {}) =>
    act(() => (handlers[type] ?? []).forEach((handler) => handler(event)));
  return { map, fire };
}

/** A Blob-like body. jsdom's Blob has no text(). */
function body(text: string) {
  const blob = new Blob([text]);
  Object.defineProperty(blob, 'text', { value: async () => text });
  return blob;
}

function setup() {
  const { map, fire } = fakeMap();
  const statuses: TileLoadStatus[] = [];
  const mapRef = { current: map } as unknown as RefObject<MapRef | null>;
  const onStatusChange = (status: TileLoadStatus) => statuses.push(status);
  const { rerender } = renderHook(
    ({ serviceKey }: { serviceKey: string }) =>
      useMapTileStatus({
        mapRef,
        isMapReady: true,
        serviceCount: serviceKey ? serviceKey.split(',').length : 0,
        serviceKey,
        onStatusChange
      }),
    { initialProps: { serviceKey: 'a' } }
  );
  return {
    fire,
    statuses,
    last: () => statuses[statuses.length - 1],
    setVisible: (serviceKey: string) => rerender({ serviceKey })
  };
}

const tileError = (code: string) => ({
  sourceId: 'service-a',
  error: Object.assign(new Error('Bad Request'), {
    status: 400,
    body: body(JSON.stringify({ code, message: `${code} message` }))
  })
});

describe('useMapTileStatus', () => {
  it('shows the tile error, not an endless loading state', async () => {
    const { fire, last } = setup();
    fire('sourcedataloading', { sourceId: 'service-a' });
    expect(last().status).toBe('loading');

    fire('error', tileError('ItemsLimitExceeded'));
    await waitFor(() => expect(last().status).toBe('error'));
    expect(last().error?.code).toBe('ItemsLimitExceeded');
    expect(last().failed).toBe(1);
  });

  it('keeps the error when the map becomes idle', async () => {
    const { fire, last } = setup();
    fire('sourcedataloading', { sourceId: 'service-a' });
    fire('error', tileError('NoDataAvailable'));
    await waitFor(() => expect(last().status).toBe('error'));

    fire('idle');
    expect(last().status).toBe('error');
  });

  it('clears the error when the view moves', async () => {
    const { fire, last } = setup();
    fire('sourcedataloading', { sourceId: 'service-a' });
    fire('error', tileError('NoDataAvailable'));
    await waitFor(() => expect(last().status).toBe('error'));

    fire('movestart');
    expect(last().status).toBe('loading');
    fire('idle');
    expect(last().status).toBe('idle');
  });

  it('ignores errors of other sources', () => {
    const { fire, statuses } = setup();
    fire('error', { sourceId: 'maptiler', error: new Error('x') });
    expect(statuses.every((status) => status.status === 'idle')).toBe(true);
  });

  it('clears the error when the failed layer is hidden', async () => {
    const { fire, last, setVisible } = setup();
    fire('sourcedataloading', { sourceId: 'service-a' });
    fire('error', tileError('NoDataAvailable'));
    await waitFor(() => expect(last().status).toBe('error'));

    setVisible('');
    expect(last().status).toBe('idle');
  });

  it('ignores an error body that is read after the map moved', async () => {
    const { fire, last, statuses } = setup();
    let resolveBody: (text: string) => void = () => {};
    const slowBody = new Blob([]);
    Object.defineProperty(slowBody, 'text', {
      value: () => new Promise<string>((resolve) => (resolveBody = resolve))
    });

    fire('sourcedataloading', { sourceId: 'service-a' });
    fire('error', {
      sourceId: 'service-a',
      error: Object.assign(new Error('Bad Request'), {
        status: 400,
        body: slowBody
      })
    });
    fire('movestart');
    expect(last().status).toBe('loading');

    await act(async () => {
      resolveBody('{"code":"NoDataAvailable","message":"old view"}');
    });
    fire('idle');
    expect(statuses.some((status) => status.status === 'error')).toBe(false);
    expect(last().status).toBe('idle');
  });
});
