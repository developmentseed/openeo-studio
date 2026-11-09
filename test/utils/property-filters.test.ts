import {
  cloudCoverFilter,
  resolvePropertyFilters
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

  it('drops invalid filters', () => {
    expect(
      resolvePropertyFilters({
        propertyFilters: [
          cloudCoverFilter(5),
          { property: 'sat:orbit_state', operator: 'like', value: 'asc' },
          { property: 'sat:orbit_state', operator: 'eq', value: null },
          'eo:cloud_cover'
        ]
      })
    ).toEqual([cloudCoverFilter(5)]);
  });

  it('returns no filter when there is none', () => {
    expect(resolvePropertyFilters({})).toEqual([]);
  });
});
