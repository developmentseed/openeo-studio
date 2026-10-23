import {
  cloudCoverFilter,
  cloudCoverOf,
  resolvePropertyFilters,
  withCloudCover
} from '$utils/property-filters';

describe('resolvePropertyFilters', () => {
  it('converts the deprecated cloudCover to a cloud cover filter', () => {
    expect(resolvePropertyFilters({ cloudCover: 20 })).toEqual([
      { property: 'eo:cloud_cover', operator: 'lt', value: 20 }
    ]);
  });

  it('keeps the cloud cover filter of propertyFilters over cloudCover', () => {
    expect(
      resolvePropertyFilters({
        cloudCover: 20,
        propertyFilters: [cloudCoverFilter(5)]
      })
    ).toEqual([cloudCoverFilter(5)]);
  });

  it('returns no filter when there is none', () => {
    expect(resolvePropertyFilters({})).toEqual([]);
  });
});

describe('cloudCoverOf', () => {
  it('reads the max of the cloud cover filter', () => {
    expect(cloudCoverOf([cloudCoverFilter(20)])).toBe(20);
  });

  it('is undefined without an `lt` cloud cover filter', () => {
    expect(cloudCoverOf([])).toBeUndefined();
    expect(
      cloudCoverOf([{ property: 'eo:cloud_cover', operator: 'gt', value: 5 }])
    ).toBeUndefined();
  });
});

describe('withCloudCover', () => {
  it('replaces the cloud cover filter and keeps the others', () => {
    const orbit = {
      property: 'sat:orbit_state',
      operator: 'eq' as const,
      value: 'ascending'
    };
    expect(withCloudCover([orbit, cloudCoverFilter(50)], 10)).toEqual([
      cloudCoverFilter(10),
      orbit
    ]);
  });
});
