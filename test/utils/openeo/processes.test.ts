/**
 * @jest-environment node
 */

jest.mock('$config/runtime', () => ({
  appConfig: { openeoApiUrl: 'https://example.test/openeo' }
}));

import { fetchProcessIds } from '$utils/openeo/processes';

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

describe('fetchProcessIds', () => {
  it('retries after a failure, then asks the backend only once', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 500 }));
    await expect(fetchProcessIds()).rejects.toThrow('500');

    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ processes: [{ id: 'add' }, { id: 'if' }] }))
    );
    expect(await fetchProcessIds()).toEqual(new Set(['add', 'if']));
    expect(await fetchProcessIds()).toEqual(new Set(['add', 'if']));

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toBe(
      'https://example.test/openeo/processes'
    );
  });
});
