import type { StacCollection } from 'stac-ts';

import { extractBandsFromStac } from '$utils/stac-band-parser';

describe('extractBandsFromStac', () => {
  it('returns an empty array when the collection is null/undefined', () => {
    expect(extractBandsFromStac(null)).toEqual([]);
    expect(extractBandsFromStac(undefined)).toEqual([]);
  });

  it('returns an empty array when neither summaries.bands nor a bands cube:dimension is present', () => {
    const collection = { summaries: { gsd: [10] } } as unknown as StacCollection;
    expect(extractBandsFromStac(collection)).toEqual([]);
  });

  describe('summaries.bands shape (e.g. EOPF explorer backend)', () => {
    const collection = {
      summaries: {
        bands: [
          {
            name: 'reflectance|b02',
            description: 'Blue (band 2)',
            'eo:common_name': 'blue',
            'eo:center_wavelength': 0.49
          },
          {
            name: 'b8a',
            description: 'Narrow NIR (band 8a)'
          }
        ]
      }
    } as unknown as StacCollection;

    it('parses label, wavelength and resolution from band metadata', () => {
      const bands = extractBandsFromStac(collection);
      expect(bands).toEqual([
        {
          name: 'reflectance|b02',
          label: 'Blue',
          commonName: 'blue',
          resolution: '10m',
          wavelength: '490 nm'
        },
        {
          name: 'b8a',
          label: 'Narrow NIR',
          commonName: undefined,
          resolution: '20m',
          wavelength: undefined
        }
      ]);
    });
  });

  describe('cube:dimensions bands shape (e.g. openeo.ds.io backend)', () => {
    const collection = {
      'cube:dimensions': {
        x: { type: 'spatial', axis: 'x' },
        t: { type: 'temporal' },
        spectral: {
          type: 'bands',
          values: ['B04_20m', 'B02_10m', 'SCL_60m', 'Product']
        }
      }
    } as unknown as StacCollection;

    it('falls back to the bands-type cube:dimensions entry', () => {
      const bands = extractBandsFromStac(collection);
      expect(bands).toEqual([
        { name: 'B04_20m', label: 'B04', resolution: '20m' },
        { name: 'B02_10m', label: 'B02', resolution: '10m' },
        { name: 'SCL_60m', label: 'SCL', resolution: '60m' },
        { name: 'Product', label: 'Product', resolution: undefined }
      ]);
    });

    it('keeps the full raw name so process graphs reference a valid band identifier', () => {
      const bands = extractBandsFromStac(collection);
      expect(bands.map((b) => b.name)).toContain('B04_20m');
    });
  });

  it('prefers summaries.bands over cube:dimensions when both are present', () => {
    const collection = {
      summaries: {
        bands: [{ name: 'b02', description: 'Blue' }]
      },
      'cube:dimensions': {
        spectral: { type: 'bands', values: ['B04_20m'] }
      }
    } as unknown as StacCollection;

    const bands = extractBandsFromStac(collection);
    expect(bands.map((b) => b.name)).toEqual(['b02']);
  });
});
