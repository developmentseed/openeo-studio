/**
 * @jest-environment node
 */

jest.mock('$config/runtime', () => ({
  appConfig: { openeoApiUrl: 'https://example.test/openeo' }
}));

import { APIError } from '$utils/api';
import {
  checkCompatibility,
  clearCompatibilityCache
} from '$utils/catalogue/compatibility';

const API = 'https://example.test/openeo';

const plainS2 = {
  id: 'sentinel-2-l2a',
  'cube:dimensions': {
    spectral: { type: 'bands', values: ['B02', 'B03', 'B04'] }
  }
};

const eopfS2 = {
  id: 'eopf-s2',
  summaries: {
    bands: [
      {
        name: 'reflectance|bands=b04',
        description: 'Red (band 4)',
        'eo:common_name': 'red'
      }
    ]
  }
};

const fetchMock = jest.fn();

beforeEach(() => {
  clearCompatibilityCache();
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (url: string) => {
    if (url === `${API}/collections/sentinel-2-l2a`) {
      return new Response(JSON.stringify(plainS2), { status: 200 });
    }
    if (url === `${API}/collections/eopf-s2`) {
      return new Response(JSON.stringify(eopfS2), { status: 200 });
    }
    if (url === `${API}/collections/wrapped-missing`) {
      return new Response(
        JSON.stringify({
          code: 'Internal',
          message:
            'Server error: {"code": "NotFoundError", "description": "Collection wrapped-missing does not exist."}'
        }),
        { status: 500, statusText: 'Internal Server Error' }
      );
    }
    if (url === `${API}/collections/broken`) {
      return new Response('boom', {
        status: 500,
        statusText: 'Server Error'
      });
    }
    return new Response('{}', { status: 404, statusText: 'Not Found' });
  });
  global.fetch = fetchMock as unknown as typeof fetch;
});

describe('checkCompatibility', () => {
  it('is compatible when every band is advertised', async () => {
    await expect(
      checkCompatibility({ collectionId: 'sentinel-2-l2a', bands: ['B04'] })
    ).resolves.toEqual({ compatible: true });
  });

  it('is compatible with no bands when the collection exists', async () => {
    await expect(
      checkCompatibility({ collectionId: 'sentinel-2-l2a', bands: [] })
    ).resolves.toEqual({ compatible: true });
  });

  it('names a single missing band', async () => {
    await expect(
      checkCompatibility({
        collectionId: 'sentinel-2-l2a',
        bands: ['B04', 'B8A']
      })
    ).resolves.toEqual({
      compatible: false,
      reason: 'band `B8A` is not available in `sentinel-2-l2a`'
    });
  });

  it('names several missing bands', async () => {
    await expect(
      checkCompatibility({
        collectionId: 'sentinel-2-l2a',
        bands: ['B8A', 'B12']
      })
    ).resolves.toEqual({
      compatible: false,
      reason: 'bands `B8A`, `B12` are not available in `sentinel-2-l2a`'
    });
  });

  it('reports a missing collection', async () => {
    await expect(
      checkCompatibility({ collectionId: 'missing-col', bands: ['B04'] })
    ).resolves.toEqual({
      compatible: false,
      reason: 'collection `missing-col` is not available'
    });
  });

  it('reports a missing collection wrapped in a 500', async () => {
    await expect(
      checkCompatibility({ collectionId: 'wrapped-missing', bands: [] })
    ).resolves.toEqual({
      compatible: false,
      reason: 'collection `wrapped-missing` is not available'
    });
  });

  it('rejects on a server error instead of reporting incompatibility', async () => {
    await expect(
      checkCompatibility({ collectionId: 'broken', bands: [] })
    ).rejects.toBeInstanceOf(APIError);
  });

  it('fetches each collection once until the cache is cleared', async () => {
    await checkCompatibility({ collectionId: 'sentinel-2-l2a', bands: [] });
    await checkCompatibility({
      collectionId: 'sentinel-2-l2a',
      bands: ['B02']
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    clearCompatibilityCache();
    await checkCompatibility({ collectionId: 'sentinel-2-l2a', bands: [] });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('retries a collection whose fetch failed', async () => {
    await expect(
      checkCompatibility({ collectionId: 'broken', bands: [] })
    ).rejects.toBeInstanceOf(APIError);
    await expect(
      checkCompatibility({ collectionId: 'broken', bands: [] })
    ).rejects.toBeInstanceOf(APIError);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('accepts the raw and common names of an EOPF band', async () => {
    await expect(
      checkCompatibility({
        collectionId: 'eopf-s2',
        bands: ['reflectance|bands=b04', 'b04', 'red']
      })
    ).resolves.toEqual({ compatible: true });
  });
});
