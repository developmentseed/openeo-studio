jest.mock('$config/runtime', () => ({
  appConfig: { openeoApiUrl: 'https://example.test/openeo' }
}));

const fetchJson = jest.fn();

jest.mock('$utils/api', () => ({
  fetchJson: (...args: unknown[]) => fetchJson(...args)
}));

import {
  clearQueryablesCache,
  getCollectionQueryables,
  getFilterableQueryables,
  getOperatorsForKind,
  getQueryableKind,
  resolveQueryables
} from '$utils/openeo/queryables';

const CAPABILITIES_WITH_QUERYABLES = {
  endpoints: [
    { path: '/collections', methods: ['GET'] },
    { path: '/collections/{collection_id}/queryables', methods: ['GET'] }
  ]
};

describe('getCollectionQueryables', () => {
  beforeEach(() => {
    fetchJson.mockReset();
    clearQueryablesCache();
  });

  it('returns null when the backend does not list the queryables endpoint', async () => {
    fetchJson.mockResolvedValueOnce({
      endpoints: [{ path: '/collections', methods: ['GET'] }]
    });

    await expect(getCollectionQueryables('sentinel-1-grd')).resolves.toBe(null);
    expect(fetchJson).toHaveBeenCalledTimes(1);
  });

  it('returns the queryables of the collection', async () => {
    fetchJson
      .mockResolvedValueOnce(CAPABILITIES_WITH_QUERYABLES)
      .mockResolvedValueOnce({
        properties: { 'eo:cloud_cover': { type: 'number' } }
      });

    await expect(getCollectionQueryables('sentinel-2-l2a')).resolves.toEqual({
      'eo:cloud_cover': { type: 'number' }
    });
    expect(fetchJson).toHaveBeenLastCalledWith(
      'https://example.test/openeo/collections/sentinel-2-l2a/queryables'
    );
  });

  it('returns null when the queryables request fails', async () => {
    fetchJson
      .mockResolvedValueOnce(CAPABILITIES_WITH_QUERYABLES)
      .mockRejectedValueOnce(new Error('404'));

    await expect(getCollectionQueryables('sentinel-1-grd')).resolves.toBe(null);
  });

  it('caches capabilities and queryables', async () => {
    fetchJson
      .mockResolvedValueOnce(CAPABILITIES_WITH_QUERYABLES)
      .mockResolvedValueOnce({ properties: {} });

    await getCollectionQueryables('sentinel-2-l2a');
    await getCollectionQueryables('sentinel-2-l2a');
    expect(fetchJson).toHaveBeenCalledTimes(2);
  });
});

describe('resolveQueryables', () => {
  it('without backend queryables, offers cloud cover and current filters', () => {
    const queryables = resolveQueryables(null, [
      { property: 'sat:orbit_state', operator: 'eq', value: 'ascending' }
    ]);
    expect(queryables['eo:cloud_cover']).toMatchObject({
      type: 'number',
      minimum: 0,
      maximum: 100
    });
    expect(queryables['sat:orbit_state']).toEqual({ type: 'string' });
  });

  it('with backend queryables, offers only these, completed with known schemas', () => {
    const queryables = resolveQueryables(
      { 'eo:cloud_cover': { type: 'number', title: 'Clouds' } },
      [{ property: 'sat:orbit_state', operator: 'eq', value: 'ascending' }]
    );
    expect(Object.keys(queryables)).toEqual(['eo:cloud_cover']);
    expect(queryables['eo:cloud_cover']).toMatchObject({
      title: 'Clouds',
      maximum: 100
    });
  });
});

describe('queryable kinds and operators', () => {
  it('maps JSON schema types to value kinds', () => {
    expect(getQueryableKind({ type: 'integer' })).toBe('number');
    expect(getQueryableKind({ type: ['number', 'null'] })).toBe('number');
    expect(getQueryableKind({ type: 'boolean' })).toBe('boolean');
    expect(getQueryableKind({ enum: ['ascending', 'descending'] })).toBe(
      'string'
    );
    expect(getQueryableKind({ type: 'object' })).toBe(null);
  });

  it('offers comparisons only for numbers', () => {
    expect(getOperatorsForKind('number')).toContain('lt');
    expect(getOperatorsForKind('string')).toEqual(['eq', 'neq']);
  });

  it('excludes extent properties and unsupported types', () => {
    const filterable = getFilterableQueryables({
      datetime: { type: 'string' },
      geometry: { type: 'object' },
      'eo:cloud_cover': { type: 'number' },
      'sat:relative_orbit': { type: 'integer' },
      'sat:orbit_state': { enum: ['ascending', 'descending'] },
      'proj:bbox': { type: 'array' }
    });

    expect(filterable.map(([property]) => property)).toEqual([
      'eo:cloud_cover',
      'sat:orbit_state',
      'sat:relative_orbit'
    ]);
  });
});
