/**
 * @jest-environment node
 */

jest.mock('$config/runtime', () => ({
  appConfig: { openeoApiUrl: 'https://example.test/openeo' }
}));
jest.mock('$utils/ruff-linter', () => ({
  formatPython: jest.fn(async (code: string) => `# formatted\n${code}`)
}));
jest.mock('$utils/openeo/processes', () => ({ fetchProcessIds: jest.fn() }));
jest.mock('$utils/catalogue/compatibility', () => ({
  checkCompatibility: jest.fn()
}));

import { checkCompatibility } from '$utils/catalogue/compatibility';
import { createApexUdpLoader } from '$utils/catalogue/loaders/apex-udp';
import {
  createApexUdpSource,
  findUdpRecords
} from '$utils/catalogue/sources/apex-udp';
import { NotFound } from '$utils/errors';
import { fetchProcessIds } from '$utils/openeo/processes';

const CONFIG = {
  owner: 'ESA-APEx',
  repo: 'apex_algorithms',
  ref: 'main'
};
const TREE_URL =
  'https://api.github.com/repos/ESA-APEx/apex_algorithms/git/trees/main?recursive=1';
const RAW = 'https://raw.githubusercontent.com/ESA-APEx/apex_algorithms/main';
const DIR = `${RAW}/algorithm_catalog`;
const UDP_URL = 'https://udp.example/max_ndvi.json';

const PATHS = [
  'algorithm_catalog/vito/max_ndvi/records/max_ndvi.json',
  'algorithm_catalog/vito/max_ndvi/records/thumbnail.png',
  'algorithm_catalog/vito/max_ndvi/benchmark_scenarios/max_ndvi.json',
  'algorithm_catalog/terradue/insar/records/insar.json',
  'algorithm_catalog/ds/fapar/records/fapar.json',
  'algorithm_catalog/ds/fapar/openeo_studio/project.json',
  'algorithm_catalog/vito/record.json',
  'algorithm_catalog/vito/max_ndvi/records/other.json'
];

const record = (title: string, type: string, href: string) => ({
  properties: { title, description: `${title} description` },
  links: [
    { rel: 'license', href: 'https://license.example' },
    { rel: 'application', type, href }
  ]
});
const OPENEO = 'application/vnd.openeo+json;type=process';

const param = (name: string) => ({ from_parameter: name });
const udp = (collection = 'SENTINEL2_L2A') => ({
  id: 'max_ndvi',
  parameters: [
    { name: 'spatial_extent', schema: { subtype: 'bounding-box' } },
    { name: 'temporal_extent', schema: { subtype: 'temporal-interval' } }
  ],
  process_graph: {
    load1: {
      process_id: 'load_collection',
      arguments: {
        id: collection,
        bands: ['B04', 'B08'],
        spatial_extent: param('spatial_extent'),
        temporal_extent: param('temporal_extent')
      }
    },
    load2: {
      process_id: 'load_collection',
      arguments: { id: 'ESA_WORLDCOVER', bands: ['MAP'] }
    },
    mask1: {
      process_id: 'mask',
      arguments: { data: { from_node: 'load1' }, mask: { from_node: 'load2' } }
    },
    ndvi1: {
      process_id: 'ndvi',
      arguments: { data: { from_node: 'mask1' } },
      result: true
    }
  }
});

const scenario = [
  {
    process_graph: {
      maxndvi1: {
        process_id: 'max_ndvi',
        namespace: 'https://x',
        arguments: {
          spatial_extent: { west: 5, south: 51, east: 6, north: 52 },
          temporal_extent: ['2023-08-01', '2023-09-30']
        },
        result: true
      }
    }
  }
];

const defaultFiles: Record<string, unknown> = {
  [`${DIR}/vito/max_ndvi/records/max_ndvi.json`]: record(
    'Max NDVI',
    OPENEO,
    UDP_URL
  ),
  [`${DIR}/terradue/insar/records/insar.json`]: record(
    'InSAR',
    'application/cwl+yaml',
    'oci://x'
  ),
  [`${DIR}/vito/max_ndvi/benchmark_scenarios/max_ndvi.json`]: scenario,
  [UDP_URL]: udp()
};

const fetchMock = jest.fn();
let storage: Map<string, string>;

function serve(files: Record<string, unknown>) {
  fetchMock.mockImplementation(async (url: string) => {
    if (url === TREE_URL) {
      return new Response(
        JSON.stringify({ tree: PATHS.map((path) => ({ path })) })
      );
    }
    if (!(url in files)) return new Response('', { status: 404 });
    const body = files[url];
    return new Response(typeof body === 'string' ? body : JSON.stringify(body));
  });
}

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
  storage = new Map();
  (globalThis as { sessionStorage?: unknown }).sessionStorage = {
    getItem: (k: string) => storage.get(k) ?? null,
    setItem: (k: string, v: string) => storage.set(k, v),
    removeItem: (k: string) => storage.delete(k)
  };
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest
    .mocked(fetchProcessIds)
    .mockResolvedValue(new Set(['load_collection', 'mask']));
  jest
    .mocked(checkCompatibility)
    .mockImplementation(async ({ collectionId }) =>
      collectionId === 'sentinel-2-l2a'
        ? { compatible: true }
        : { compatible: false, reason: 'missing' }
    );
});

afterEach(() => jest.restoreAllMocks());

describe('findUdpRecords', () => {
  it('keeps the records of algorithms without a studio project', () => {
    expect(findUdpRecords(PATHS)).toEqual([
      {
        provider: 'vito',
        algo: 'max_ndvi',
        path: 'algorithm_catalog/vito/max_ndvi/records/max_ndvi.json',
        thumbnailPath: 'algorithm_catalog/vito/max_ndvi/records/thumbnail.png'
      },
      {
        provider: 'terradue',
        algo: 'insar',
        path: 'algorithm_catalog/terradue/insar/records/insar.json'
      }
    ]);
  });
});

describe('createApexUdpSource', () => {
  it('lists the algorithms that have an openEO process graph', async () => {
    serve(defaultFiles);
    const source = createApexUdpSource(CONFIG);
    expect(source.id).toBe('apex-udp');

    const { items } = await source.listEntries({}, {});
    // No collection: an entry that doesn't match the backend is still listed.
    expect(items).toEqual([
      {
        id: 'vito/max_ndvi',
        name: 'Max NDVI',
        description: 'Max NDVI description',
        thumbnail: `${DIR}/vito/max_ndvi/records/thumbnail.png`,
        tags: ['vito'],
        open: { loader: 'apex-udp', ref: 'vito/max_ndvi' }
      }
    ]);
    // eslint-disable-next-line no-console
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('caches the list when the other records are just not openEO', async () => {
    serve(defaultFiles);
    await createApexUdpSource(CONFIG).listEntries({}, {});
    const key = 'apex-udp-catalogue:ESA-APEx/apex_algorithms@main';
    expect(JSON.parse(storage.get(key)!).entries).toHaveLength(1);
  });

  it('shares the tree request with another APEx source', async () => {
    serve(defaultFiles);
    await Promise.all([
      createApexUdpSource(CONFIG).listEntries({}, {}),
      createApexUdpSource(CONFIG).listEntries({}, {})
    ]);
    const treeCalls = fetchMock.mock.calls.filter(([u]) => u === TREE_URL);
    expect(treeCalls).toHaveLength(1);
  });
});

describe('createApexUdpLoader', () => {
  const load = (ref = 'vito/max_ndvi') =>
    createApexUdpLoader(CONFIG).load(ref, { authToken: 'token' });

  it('writes the code and the configuration of the algorithm', async () => {
    serve(defaultFiles);
    const result = await load();

    expect(result.autoRun).toBe(false);
    expect(result.generated).toBe(true);
    expect(result.seed).toMatchObject({
      name: 'Max NDVI',
      // The catalogue replaces a collection the backend doesn't have.
      collectionId: 'SENTINEL2_L2A',
      bands: ['B04', 'B08'],
      temporalRange: ['2023-08-01', '2023-09-30'],
      boundingBox: [5, 51, 6, 52],
      propertyFilters: []
    });
    const code = result.seed.suggestedAlgorithm!;
    expect(code).toMatch(/^# formatted\n# Max NDVI\n/);
    expect(code).toContain('mask_1 = datacube.mask(mask=esa_worldcover)');
    expect(code).toContain('add_graph_to_map(map_layer, "Max NDVI")');
  });

  it('names what does not match the backend', async () => {
    serve(defaultFiles);
    const { incompatibilities } = await load();

    expect(incompatibilities).toEqual([
      'Collection "ESA_WORLDCOVER" is not available.',
      'Process "ndvi" is not available on this backend.',
      'The UDP loads more than one collection, which Studio does not support natively.'
    ]);
    expect(fetchProcessIds).toHaveBeenCalledWith('token');
  });

  it('keeps a collection the backend has under the same name', async () => {
    serve({ ...defaultFiles, [UDP_URL]: udp('sentinel-2-l2a') });
    const { seed, incompatibilities } = await load();

    expect(seed.collectionId).toBe('sentinel-2-l2a');
    expect(incompatibilities).not.toContainEqual(
      expect.stringContaining('sentinel-2-l2a')
    );
  });

  it('leaves an unknown main collection for the catalogue to replace', async () => {
    serve({ ...defaultFiles, [UDP_URL]: udp('LANDSAT8') });
    const { seed, incompatibilities } = await load();

    expect(seed.collectionId).toBe('LANDSAT8');
    expect(incompatibilities).not.toContainEqual(
      expect.stringContaining('LANDSAT8')
    );
  });

  it('opens without a benchmark scenario', async () => {
    const files = { ...defaultFiles };
    delete files[`${DIR}/vito/max_ndvi/benchmark_scenarios/max_ndvi.json`];
    serve(files);
    const { seed } = await load();

    expect(seed.temporalRange).toEqual(['', '']);
    expect(seed.boundingBox).toBeUndefined();
  });

  it('says so when the processes cannot be checked', async () => {
    serve(defaultFiles);
    jest.mocked(fetchProcessIds).mockRejectedValue(new Error('down'));
    const { incompatibilities } = await load();

    expect(incompatibilities).toContain(
      'The processes could not be checked against the backend.'
    );
  });

  it('resolves a UDP link relative to the record', async () => {
    serve({
      [`${DIR}/vito/max_ndvi/records/max_ndvi.json`]: record(
        'Max NDVI',
        OPENEO,
        '../openeo_udp/max_ndvi.json'
      ),
      [`${DIR}/vito/max_ndvi/openeo_udp/max_ndvi.json`]: udp()
    });
    await expect(load()).resolves.toMatchObject({ generated: true });
  });

  it.each([
    ['a reference outside the catalogue', '../x/y', {}],
    ['a reference with more parts', 'vito/max_ndvi/extra', {}],
    [
      'an algorithm without an openEO process graph',
      'terradue/insar',
      defaultFiles
    ],
    [
      'a record that is not JSON',
      'vito/max_ndvi',
      { [`${DIR}/vito/max_ndvi/records/max_ndvi.json`]: '<html>' }
    ],
    [
      'a UDP without a process graph',
      'vito/max_ndvi',
      { ...defaultFiles, [UDP_URL]: { id: 'max_ndvi' } }
    ]
  ])('rejects %s as not found', async (_, ref, files) => {
    serve(files);
    await expect(load(ref)).rejects.toBeInstanceOf(NotFound);
  });
});
