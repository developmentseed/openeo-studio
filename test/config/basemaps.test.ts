import {
  DEFAULT_BASE_MAPS,
  parseBaseMaps,
  resolveBaseLayers,
  toMapStyle
} from '$config/basemaps';

const TILE_URL = 'https://tiles.example.com/{z}/{x}/{y}.png';
const STYLE_URL = 'https://styles.example.com/light.json';
const DARK_STYLE_URL = 'https://styles.example.com/dark.json';

describe('toMapStyle', () => {
  it('uses a style URL as is', () => {
    expect(toMapStyle(STYLE_URL)).toBe(STYLE_URL);
  });

  it('wraps a tile URL template in a raster style', () => {
    expect(toMapStyle(TILE_URL, { attribution: '© Example' })).toEqual({
      version: 8,
      sources: {
        basemap: {
          type: 'raster',
          tiles: [TILE_URL],
          tileSize: 256,
          attribution: '© Example'
        }
      },
      layers: [{ id: 'basemap', type: 'raster', source: 'basemap' }]
    });
  });

  it('leaves attribution out when not given', () => {
    const style = toMapStyle(TILE_URL);
    expect(typeof style).toBe('object');
    expect(style).not.toHaveProperty('sources.basemap.attribution');
    expect(style).not.toHaveProperty('sources.basemap.maxzoom');
  });

  it('sets maxzoom on the raster source', () => {
    expect(toMapStyle(TILE_URL, { maxzoom: 18 })).toMatchObject({
      sources: { basemap: { maxzoom: 18 } }
    });
  });
});

describe('parseBaseMaps', () => {
  it('parses valid entries', () => {
    const raw = JSON.stringify([
      { label: 'Streets', light: STYLE_URL, dark: DARK_STYLE_URL },
      { label: 'Tiles', dark: TILE_URL, attribution: '© Example' }
    ]);
    expect(parseBaseMaps(raw)).toEqual([
      {
        label: 'Streets',
        light: STYLE_URL,
        dark: DARK_STYLE_URL,
        attribution: undefined
      },
      {
        label: 'Tiles',
        light: undefined,
        dark: TILE_URL,
        attribution: '© Example'
      }
    ]);
  });

  it.each([
    ['not JSON', '[{', /not valid JSON/],
    ['not an array', '{"label":"A"}', /non-empty JSON array/],
    ['an empty array', '[]', /non-empty JSON array/],
    ['an entry that is not an object', '["x"]', /entry 1 must be an object/],
    [
      'an entry without a label',
      `[{"light":"${STYLE_URL}"}]`,
      /needs a "label"/
    ],
    ['an entry without a URL', '[{"label":"A"}]', /needs a "light" or "dark"/],
    [
      'an entry with an empty URL',
      '[{"label":"A","light":" "}]',
      /needs a "light" or "dark"/
    ],
    [
      'an attribution that is not a string',
      `[{"label":"A","light":"${STYLE_URL}","attribution":1}]`,
      /"attribution" must be a string/
    ],
    [
      'a URL that is not a string',
      '[{"label":"A","light":5}]',
      /"light" must be a string/
    ],
    [
      'a maxzoom that is not a number',
      `[{"label":"A","light":"${TILE_URL}","maxzoom":"18"}]`,
      /"maxzoom" must be a number/
    ]
  ])('rejects %s', (_, raw, message) => {
    expect(() => parseBaseMaps(raw)).toThrow(message);
  });
});

describe('resolveBaseLayers', () => {
  it('uses BASEMAPS when set', () => {
    const layers = resolveBaseLayers({
      basemaps: JSON.stringify([
        { label: 'My Streets', light: STYLE_URL, dark: DARK_STYLE_URL }
      ]),
      maptilerKey: 'key'
    });
    expect(layers).toEqual([
      {
        id: 'my-streets',
        label: 'My Streets',
        style: { light: STYLE_URL, dark: DARK_STYLE_URL }
      }
    ]);
  });

  it('uses the one URL given for both light and dark mode', () => {
    const [lightOnly, darkOnly] = resolveBaseLayers({
      basemaps: JSON.stringify([
        { label: 'A', light: STYLE_URL },
        { label: 'B', dark: DARK_STYLE_URL }
      ]),
      maptilerKey: ''
    });
    expect(lightOnly.style).toEqual({ light: STYLE_URL, dark: STYLE_URL });
    expect(darkOnly.style).toEqual({
      light: DARK_STYLE_URL,
      dark: DARK_STYLE_URL
    });
  });

  it('gives entries with the same label distinct ids', () => {
    const layers = resolveBaseLayers({
      basemaps: JSON.stringify([
        { label: 'Map', light: STYLE_URL },
        { label: 'Map', light: STYLE_URL },
        { label: '!!!', light: STYLE_URL }
      ]),
      maptilerKey: ''
    });
    expect(layers.map((layer) => layer.id)).toEqual([
      'map',
      'map-2',
      'basemap-3'
    ]);
  });

  it('uses the MapTiler presets when only a MapTiler key is set', () => {
    const layers = resolveBaseLayers({ basemaps: '', maptilerKey: 'abc' });
    expect(layers.map((layer) => layer.id)).toEqual([
      'satellite',
      'streets',
      'topographic'
    ]);
    expect(layers[0].style.light).toBe(
      'https://api.maptiler.com/maps/satellite-v4/style.json?key=abc'
    );
  });

  it('uses the keyless defaults when nothing is set', () => {
    const layers = resolveBaseLayers({ basemaps: '', maptilerKey: '' });
    expect(layers.map((layer) => layer.label)).toEqual(
      DEFAULT_BASE_MAPS.map((entry) => entry.label)
    );
  });

  it('reports an invalid BASEMAPS and falls back', () => {
    const onInvalid = jest.fn();
    const layers = resolveBaseLayers({
      basemaps: 'nope',
      maptilerKey: 'abc',
      onInvalid
    });
    expect(onInvalid).toHaveBeenCalledWith(
      expect.stringMatching(/not valid JSON/)
    );
    expect(layers[0].id).toBe('satellite');
  });
});
