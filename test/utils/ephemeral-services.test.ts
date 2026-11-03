/**
 * @jest-environment node
 */

// The node environment provides fetch's Response, so the real fetchJson
// error path (APIError with the status code) runs against a mocked fetch.

jest.mock('$config/runtime', () => ({
  appConfig: { openeoApiUrl: 'https://example.test/openeo' }
}));

import {
  cleanupOrphanedServices,
  cleanupServices,
  createEphemeralServices,
  DELETE_CONCURRENCY,
  MAX_DELETES_PER_RUN
} from '$utils/openeo/ephemeral-services';
import {
  deleteOpenEOService,
  type DeleteOutcome
} from '$utils/openeo/services';
import { ephemeralTitleFor } from '$utils/openeo/service-titles';
import type { GraphResult } from '$types';

const API = 'https://example.test/openeo';
const INSTANCE = 'test-instance';

const graph: GraphResult = {
  name: 'layer',
  process_graph: {},
  parameters: [],
  visible: true
};

// What the backend answers to the n-th DELETE (0-based): a status code, or an
// Error for a network failure.
let deleteReply: (n: number) => number | Error;
let backendServices: { id: string; title: string }[];
let deletesSent: number;
let inFlight: number;
let maxInFlight: number;
let created = 0;

function backlog(size: number) {
  return Array.from({ length: size }, (_, i) => ({
    id: `svc-${i}`,
    title: ephemeralTitleFor(INSTANCE)
  }));
}

const fetchMock = jest.fn(
  async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);

    if (init?.method === 'DELETE') {
      const reply = deleteReply(deletesSent++);
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 1));
      inFlight--;

      if (reply instanceof Error) throw reply;
      if (reply < 300) {
        backendServices = backendServices.filter(
          (s) => url !== `${API}/services/${s.id}`
        );
      }
      return new Response(null, { status: reply });
    }

    if (init?.method === 'POST') {
      return new Response(null, {
        status: 201,
        headers: { Location: `${API}/services/new-${created++}` }
      });
    }

    const body =
      url === `${API}/services`
        ? { services: backendServices }
        : { url: 'https://tiles.example/{z}/{x}/{y}' };
    return new Response(JSON.stringify(body), { status: 200 });
  }
);
global.fetch = fetchMock as unknown as typeof fetch;
jest.spyOn(console, 'warn').mockImplementation(() => {});

describe('ephemeral service cleanup', () => {
  beforeEach(() => {
    deleteReply = () => 204;
    backendServices = [];
    deletesSent = 0;
    inFlight = 0;
    maxInFlight = 0;
  });

  it.each<[number | Error, DeleteOutcome]>([
    [204, 'deleted'],
    [404, 'deleted'],
    [403, 'refused'],
    [503, 'refused'],
    [new TypeError('Failed to fetch'), 'refused']
  ])('deleteOpenEOService reports %p as %s', async (reply, outcome) => {
    deleteReply = () => reply;

    await expect(
      deleteOpenEOService(`${API}/services/svc-0`, 'token')
    ).resolves.toBe(outcome);
  });

  it('keeps at most DELETE_CONCURRENCY DELETEs in flight for a 196-service backlog', async () => {
    backendServices = backlog(196);

    await cleanupOrphanedServices('token', INSTANCE);

    expect(maxInFlight).toBe(DELETE_CONCURRENCY);
  });

  it('sends at most MAX_DELETES_PER_RUN DELETEs per run and drains the rest on later runs', async () => {
    backendServices = backlog(196);

    await cleanupOrphanedServices('token', INSTANCE);
    expect(deletesSent).toBe(MAX_DELETES_PER_RUN);
    expect(backendServices).toHaveLength(196 - MAX_DELETES_PER_RUN);

    for (let run = 2; run <= Math.ceil(196 / MAX_DELETES_PER_RUN); run++) {
      await cleanupOrphanedServices('token', INSTANCE);
    }
    expect(backendServices).toHaveLength(0);
  });

  it.each([401, 403, 500, 503, new TypeError('Failed to fetch')])(
    'stops the run when every DELETE is refused with %p',
    async (reply) => {
      backendServices = backlog(196);
      deleteReply = () => reply;

      await cleanupOrphanedServices('token', INSTANCE);

      // Only the first batch goes out; the rest wait for the next run.
      expect(deletesSent).toBe(DELETE_CONCURRENCY);
      expect(backendServices).toHaveLength(196);
    }
  );

  it('stops the run at a 503 midway through the backlog', async () => {
    backendServices = backlog(196);
    deleteReply = (n) => (n === 5 ? 503 : 204);

    await cleanupOrphanedServices('token', INSTANCE);

    // DELETE #6 is refused; at most the ones already in flight follow it.
    expect(deletesSent).toBeGreaterThanOrEqual(6);
    expect(deletesSent).toBeLessThanOrEqual(6 + DELETE_CONCURRENCY - 1);
  });

  it('counts a 404 as deleted and keeps going', async () => {
    backendServices = backlog(10);
    deleteReply = (n) => (n % 2 ? 404 : 204);

    await cleanupOrphanedServices('token', INSTANCE);

    expect(deletesSent).toBe(10);
  });

  it('bounds and stops the cleanup of the session services too', async () => {
    await createEphemeralServices(Array(10).fill(graph), 'token', INSTANCE);
    deleteReply = () => 403;

    await cleanupServices('token');

    expect(deletesSent).toBe(DELETE_CONCURRENCY);
  });

  it('never throws, even when the list or every DELETE fails', async () => {
    deleteReply = () => new TypeError('Failed to fetch');
    await createEphemeralServices([graph], 'token', INSTANCE);
    backendServices = backlog(5);

    await expect(cleanupServices('token')).resolves.toBeUndefined();
    await expect(
      cleanupOrphanedServices('token', INSTANCE)
    ).resolves.toBeUndefined();

    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(
      cleanupOrphanedServices('token', INSTANCE)
    ).resolves.toBeUndefined();
  });
});
