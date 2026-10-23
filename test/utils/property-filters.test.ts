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

  it('returns no filter when there is none', () => {
    expect(resolvePropertyFilters({})).toEqual([]);
  });
});
