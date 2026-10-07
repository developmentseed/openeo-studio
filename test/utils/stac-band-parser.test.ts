import type { StacCollection } from 'stac-ts';

import {
  collectionBandIdentifiers,
  extractBandsFromStac,
  findBandByReference,
  isCollectionCompatible
} from '$utils/stac-band-parser';

describe('extractBandsFromStac', () => {
  it('returns an empty array when the collection is null/undefined', () => {
    expect(extractBandsFromStac(null)).toEqual([]);
    expect(extractBandsFromStac(undefined)).toEqual([]);
  });

  it('returns an empty array when neither summaries.bands nor a bands cube:dimension is present', () => {
    const collection = {
      summaries: { gsd: [10] }
    } as unknown as StacCollection;
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
          },
          {
            // Current titiler-eopf notation
            name: 'reflectance|bands=b12',
            description: 'SWIR 2 (band 12)'
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
        },
        {
          name: 'reflectance|bands=b12',
          label: 'SWIR 2',
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

// Fixtures from the EOPF explorer backend and a titiler-openeo backend on
// the Planetary Computer catalog (cut down to a few bands).
const eopfS2 = {
  id: 'sentinel-2-l2a',
  summaries: {
    bands: [
      { name: 'SCL_20m', description: 'Scene classification' },
      {
        name: 'reflectance|bands=b02',
        description: 'Blue (band 2)',
        'eo:common_name': 'blue'
      },
      {
        name: 'reflectance|bands=b03',
        description: 'Green (band 3)',
        'eo:common_name': 'green'
      },
      {
        name: 'reflectance|bands=b04',
        description: 'Red (band 4)',
        'eo:common_name': 'red'
      },
      {
        name: 'reflectance|bands=b10',
        description: 'Cirrus (band 10)',
        'eo:common_name': 'cirrus'
      }
    ]
  }
} as unknown as StacCollection;

const eopfS2New = {
  id: 'sentinel-2-l2a-new',
  summaries: {
    bands: (eopfS2.summaries!.bands as { name: string }[]).filter(
      (b) => b.name !== 'reflectance|bands=b10'
    )
  }
} as unknown as StacCollection;

const pcS2 = {
  id: 'sentinel-2-l2a',
  summaries: {
    bands: [
      { name: 'red', 'eo:common_name': 'red' },
      { name: 'B04', 'eo:common_name': 'red' },
      { name: 'B02', 'eo:common_name': 'blue' },
      { name: 'B02', 'eo:common_name': 'blue' },
      { name: 'B03', 'eo:common_name': 'green' }
    ]
  },
  'cube:dimensions': {
    spectral: {
      type: 'bands',
      values: ['B02', 'B03', 'B04', 'SCL', 'blue', 'green', 'red']
    }
  }
} as unknown as StacCollection;

const pcLandsat = {
  id: 'landsat-c2-l2',
  summaries: {
    bands: [
      { name: 'red', common_name: 'red' },
      { name: 'green', common_name: 'green' },
      { name: 'blue', common_name: 'blue' }
    ]
  },
  'cube:dimensions': {
    spectral: { type: 'bands', values: ['blue', 'green', 'qa', 'red'] }
  }
} as unknown as StacCollection;

const pcS1 = {
  id: 'sentinel-1-rtc',
  'cube:dimensions': {
    spectral: { type: 'bands', values: ['hh', 'hv', 'vh', 'vv'] }
  }
} as unknown as StacCollection;

const pcDem = {
  id: 'alos-fnf-mosaic',
  summaries: { instruments: ['palsar'] }
} as unknown as StacCollection;

describe('extractBandsFromStac duplicates', () => {
  it('keeps only the first band with a given name', () => {
    expect(extractBandsFromStac(pcS2).map((b) => b.name)).toEqual([
      'red',
      'B04',
      'B02',
      'B03'
    ]);
  });
});

describe('collectionBandIdentifiers', () => {
  it('accepts the advertised name, the raw name and the common name (EOPF)', () => {
    const ids = collectionBandIdentifiers(eopfS2);
    expect(ids.has('reflectance|bands=b04')).toBe(true);
    expect(ids.has('b04')).toBe(true);
    expect(ids.has('red')).toBe(true);
    expect(ids.has('B04')).toBe(false);
  });

  it('accepts the asset name and the common name (Planetary Computer)', () => {
    const ids = collectionBandIdentifiers(pcS2);
    expect(ids.has('B04')).toBe(true);
    expect(ids.has('red')).toBe(true);
    expect(ids.has('SCL')).toBe(true);
    expect(ids.has('reflectance|bands=b04')).toBe(false);
  });

  it('uses cube:dimensions names when there is no band metadata', () => {
    const ids = collectionBandIdentifiers(pcS1);
    expect(ids.has('vv')).toBe(true);
    expect(ids.has('red')).toBe(false);
  });

  it('is empty for a collection without bands', () => {
    expect(collectionBandIdentifiers(pcDem).size).toBe(0);
    expect(collectionBandIdentifiers(null).size).toBe(0);
  });
});

describe('isCollectionCompatible', () => {
  const all = [eopfS2, eopfS2New, pcS2, pcLandsat, pcS1, pcDem];
  const compatibleWith = (bands: string[]) =>
    all
      .filter((c) => isCollectionCompatible(c, bands))
      .map((c) => `${c.id}${c === pcS2 ? ' (pc)' : ''}`);

  it('matches common names across backends', () => {
    expect(compatibleWith(['red', 'green', 'blue'])).toEqual([
      'sentinel-2-l2a',
      'sentinel-2-l2a-new',
      'sentinel-2-l2a (pc)',
      'landsat-c2-l2'
    ]);
  });

  it('keeps backend-specific notations as written', () => {
    expect(
      compatibleWith(['reflectance|bands=b02', 'reflectance|bands=b04'])
    ).toEqual(['sentinel-2-l2a', 'sentinel-2-l2a-new']);
    expect(compatibleWith(['B02', 'B04'])).toEqual(['sentinel-2-l2a (pc)']);
  });

  it('rejects a collection that misses one selected band', () => {
    expect(compatibleWith(['reflectance|bands=b10', 'blue'])).toEqual([
      'sentinel-2-l2a'
    ]);
  });

  it('accepts any collection with bands when no band is selected', () => {
    expect(compatibleWith([])).toHaveLength(5);
  });
});

describe('findBandByReference', () => {
  const bands = extractBandsFromStac(eopfS2);

  it('finds a band by any accepted reference', () => {
    expect(findBandByReference('red', bands)?.name).toBe(
      'reflectance|bands=b04'
    );
    expect(findBandByReference('b04', bands)?.name).toBe(
      'reflectance|bands=b04'
    );
    expect(findBandByReference('B04', bands)).toBeUndefined();
  });

  it('prefers an exact advertised name over a common name', () => {
    expect(findBandByReference('red', extractBandsFromStac(pcS2))?.name).toBe(
      'red'
    );
  });
});
