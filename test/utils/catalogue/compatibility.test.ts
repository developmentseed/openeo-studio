/**
 * @jest-environment node
 */

jest.mock('$config/runtime', () => ({
  appConfig: { openeoApiUrl: 'https://example.test/openeo' }
}));
jest.mock('$utils/openeo/queryables', () => ({
  getCollectionQueryables: jest.fn()
}));

import { APIError } from '$utils/api';
import {
  checkCompatibility,
  clearCompatibilityCache,
  reconcileSeed
} from '$utils/catalogue/compatibility';
import { getCollectionQueryables } from '$utils/openeo/queryables';

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

describe('reconcileSeed', () => {
  const queryables = getCollectionQueryables as jest.Mock;
  const cloud = {
    property: 'eo:cloud_cover',
    operator: 'lt' as const,
    value: 20
  };
  const orbit = {
    property: 'sat:orbit_state',
    operator: 'eq' as const,
    value: 'ascending'
  };
  const seed = {
    name: 'S',
    collectionId: 'sentinel-2-l2a',
    temporalRange: ['2025-01-01', '2025-01-02'] as [string, string],
    propertyFilters: [cloud, orbit],
    bands: ['B04', 'B99'],
    suggestedAlgorithm: 'code'
  };

  beforeEach(() => {
    queryables.mockReset();
    queryables.mockResolvedValue({ 'eo:cloud_cover': {} });
  });

  it('keeps the supported values and names the others', async () => {
    await expect(reconcileSeed(seed)).resolves.toEqual({
      seed: { ...seed, bands: ['B04'], propertyFilters: [cloud] },
      incompatibilities: [
        'Band "B99" is not available in "sentinel-2-l2a".',
        'Property "sat:orbit_state" can\'t be filtered on in "sentinel-2-l2a".'
      ]
    });
  });

  it('names every missing band', async () => {
    const { incompatibilities } = await reconcileSeed({
      ...seed,
      bands: ['B98', 'B99']
    });
    expect(incompatibilities[0]).toBe(
      'Bands "B98", "B99" are not available in "sentinel-2-l2a".'
    );
  });

  it('falls back to the default collection and keeps the code', async () => {
    const result = await reconcileSeed({
      ...seed,
      collectionId: 'missing-col'
    });
    expect(result.seed.collectionId).toBe('sentinel-2-l2a');
    expect(result.seed.bands).toEqual(['B04']);
    expect(result.seed.suggestedAlgorithm).toBe('code');
    expect(result.incompatibilities[0]).toBe(
      'Collection "missing-col" is not available. Using "sentinel-2-l2a" instead.'
    );
    expect(queryables).toHaveBeenCalledWith('sentinel-2-l2a');
  });

  it('keeps every filter when the queryables are unknown', async () => {
    queryables.mockResolvedValue(null);
    const result = await reconcileSeed(seed);
    expect(result.seed.propertyFilters).toEqual([cloud, orbit]);
  });

  it('rejects when the backend fails', async () => {
    await expect(
      reconcileSeed({ ...seed, collectionId: 'broken' })
    ).rejects.toBeInstanceOf(APIError);
  });
});
