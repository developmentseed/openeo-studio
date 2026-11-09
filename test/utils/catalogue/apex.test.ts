/**
 * @jest-environment node
 */

import {
  createApexSource,
  findStudioProjects
} from '$utils/catalogue/sources/apex';

const CONFIG = { owner: 'ESA-APEx', repo: 'apex_algorithms', ref: 'main' };
const TREE_URL =
  'https://api.github.com/repos/ESA-APEx/apex_algorithms/git/trees/main?recursive=1';
const RAW = 'https://raw.githubusercontent.com/ESA-APEx/apex_algorithms/main';
const CACHE_KEY = 'apex-catalogue:ESA-APEx/apex_algorithms@main';

const PATHS = [
  'algorithm_catalog/ds/fapar/openeo_studio/project.json',
  'algorithm_catalog/ds/fapar/records/thumbnail.png',
  'algorithm_catalog/vito/fapar/openeo_studio/project.json',
  'algorithm_catalog/ds/ndvi/openeo_studio/ndvi.json',
  'algorithm_catalog/ds/x/openeo_udp/project.json'
];

const projectFile = (name: string) => ({
  name,
  description: `${name} description`,
  collectionId: 'sentinel-2-l2a',
  bands: ['B04'],
  temporalRange: ['2025-01-01', '2025-01-02'],
  algorithm: './x.py'
});

const fetchMock = jest.fn();
let storage: Map<string, string>;

function serve(files: Record<string, unknown>, treeExtra = {}) {
  fetchMock.mockImplementation(async (url: string) => {
    if (url === TREE_URL) {
      return new Response(
        JSON.stringify({
          tree: PATHS.map((path) => ({ path, type: 'blob' })),
          truncated: false,
          ...treeExtra
        })
      );
    }
    if (!(url in files)) return new Response('', { status: 404 });
    const body = files[url];
    return new Response(typeof body === 'string' ? body : JSON.stringify(body));
  });
}

const defaultFiles = {
  [`${RAW}/algorithm_catalog/ds/fapar/openeo_studio/project.json`]:
    projectFile('DS FAPAR'),
  [`${RAW}/algorithm_catalog/vito/fapar/openeo_studio/project.json`]:
    projectFile('VITO FAPAR')
};

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
});

afterEach(() => jest.restoreAllMocks());

describe('findStudioProjects', () => {
  it('keeps only openeo_studio/project.json paths', () => {
    expect(findStudioProjects(PATHS)).toEqual([
      {
        provider: 'ds',
        algo: 'fapar',
        path: 'algorithm_catalog/ds/fapar/openeo_studio/project.json',
        thumbnailPath: 'algorithm_catalog/ds/fapar/records/thumbnail.png'
      },
      {
        provider: 'vito',
        algo: 'fapar',
        path: 'algorithm_catalog/vito/fapar/openeo_studio/project.json'
      }
    ]);
  });
});

describe('createApexSource', () => {
  it('lists one entry per studio project', async () => {
    serve(defaultFiles);
    const source = createApexSource(CONFIG);
    expect(source.id).toBe('apex');
    expect(source.label).toBe('APEx');

    const { items, nextCursor } = await source.listEntries({}, {});
    expect(fetchMock).toHaveBeenCalledWith(TREE_URL, expect.anything());
    expect(nextCursor).toBeUndefined();
    expect(items).toEqual([
      {
        id: 'ds/fapar',
        name: 'DS FAPAR',
        description: 'DS FAPAR description',
        collectionId: 'sentinel-2-l2a',
        bands: ['B04'],
        thumbnail: `${RAW}/algorithm_catalog/ds/fapar/records/thumbnail.png`,
        tags: ['ds'],
        open: {
          loader: 'project-url',
          ref: `${RAW}/algorithm_catalog/ds/fapar/openeo_studio/project.json`
        }
      },
      {
        id: 'vito/fapar',
        name: 'VITO FAPAR',
        description: 'VITO FAPAR description',
        collectionId: 'sentinel-2-l2a',
        bands: ['B04'],
        thumbnail: undefined,
        tags: ['vito'],
        open: {
          loader: 'project-url',
          ref: `${RAW}/algorithm_catalog/vito/fapar/openeo_studio/project.json`
        }
      }
    ]);
  });

  it('drops a project file that fails to load', async () => {
    serve({
      ...defaultFiles,
      [`${RAW}/algorithm_catalog/vito/fapar/openeo_studio/project.json`]:
        'not json'
    });
    const { items } = await createApexSource(CONFIG).listEntries({}, {});
    expect(items.map((e) => e.id)).toEqual(['ds/fapar']);
    expect(console.warn).toHaveBeenCalled();
  });

  it('does not cache a partial list', async () => {
    serve({
      [`${RAW}/algorithm_catalog/ds/fapar/openeo_studio/project.json`]:
        projectFile('DS FAPAR')
    });
    const source = createApexSource(CONFIG);
    await source.listEntries({}, {});
    expect(storage.has(CACHE_KEY)).toBe(false);

    serve(defaultFiles);
    const { items } = await source.listEntries({}, {});
    expect(items).toHaveLength(2);
  });

  it('rejects when every project file fails', async () => {
    serve({});
    await expect(createApexSource(CONFIG).listEntries({}, {})).rejects.toThrow(
      'No APEx project file could be loaded'
    );
    expect(storage.has(CACHE_KEY)).toBe(false);
  });

  it('warns when the tree is truncated', async () => {
    serve(defaultFiles, { truncated: true });
    await createApexSource(CONFIG).listEntries({}, {});
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('truncated')
    );
  });

  it('rejects when the tree call fails', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 403 }));
    await expect(createApexSource(CONFIG).listEntries({}, {})).rejects.toThrow(
      '403'
    );
  });

  it('fetches the tree once per source', async () => {
    serve(defaultFiles);
    const source = createApexSource(CONFIG);
    await source.listEntries({}, {});
    await source.listEntries({ text: 'vito' }, {});
    const treeCalls = fetchMock.mock.calls.filter(([u]) => u === TREE_URL);
    expect(treeCalls).toHaveLength(1);
  });

  it('shares one fetch between concurrent calls', async () => {
    serve(defaultFiles);
    const source = createApexSource(CONFIG);
    await Promise.all([source.listEntries({}, {}), source.listEntries({}, {})]);
    const treeCalls = fetchMock.mock.calls.filter(([u]) => u === TREE_URL);
    expect(treeCalls).toHaveLength(1);
  });

  it('filters by text and pages with a cursor', async () => {
    serve(defaultFiles);
    const source = createApexSource(CONFIG);
    expect(
      (await source.listEntries({ text: 'vito' }, {})).items.map((e) => e.id)
    ).toEqual(['vito/fapar']);

    const first = await source.listEntries({ pageSize: 1 }, {});
    const second = await source.listEntries(
      { pageSize: 1 },
      {},
      first.nextCursor
    );
    expect(second.items.map((e) => e.id)).toEqual(['vito/fapar']);
  });

  it('uses a fresh session cache without calling the API', async () => {
    const cached = [{ id: 'cached/x', name: 'Cached', description: '' }];
    storage.set(
      CACHE_KEY,
      JSON.stringify({ savedAt: Date.now(), entries: cached })
    );
    serve(defaultFiles);
    const { items } = await createApexSource(CONFIG).listEntries({}, {});
    expect(items).toEqual(cached);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('writes the session cache after listing', async () => {
    serve(defaultFiles);
    await createApexSource(CONFIG).listEntries({}, {});
    const saved = JSON.parse(storage.get(CACHE_KEY)!);
    expect(saved.entries).toHaveLength(2);
    expect(typeof saved.savedAt).toBe('number');
  });

  it('ignores an expired session cache', async () => {
    storage.set(
      CACHE_KEY,
      JSON.stringify({ savedAt: Date.now() - 3_600_001, entries: [] })
    );
    serve(defaultFiles);
    const { items } = await createApexSource(CONFIG).listEntries({}, {});
    expect(items).toHaveLength(2);
  });

  it('ignores a corrupt session cache', async () => {
    storage.set(CACHE_KEY, '{not json');
    serve(defaultFiles);
    const { items } = await createApexSource(CONFIG).listEntries({}, {});
    expect(items).toHaveLength(2);
  });
});
