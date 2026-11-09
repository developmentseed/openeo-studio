/**
 * @jest-environment node
 */

import { projectUrlLoader } from '$utils/catalogue/loaders/project-url';
import { NotFound } from '$utils/errors';

const BASE = 'https://raw.example/algorithm_catalog/p/fapar/openeo_studio';
const URL_ = `${BASE}/project.json`;

const project = {
  id: 'fapar',
  name: 'FAPAR',
  description: 'Fraction of absorbed radiation',
  collectionId: 'sentinel-2-l2a',
  algorithm: './fapar.py',
  bands: ['B03', 'B04'],
  temporalRange: ['2025-05-10', '2025-05-12'],
  boundingBox: [14.09, 45.174, 14.27, 45.25]
};

const fetchMock = jest.fn();

function serve(files: Record<string, unknown>) {
  fetchMock.mockImplementation(async (url: string) => {
    if (!(url in files)) {
      return new Response('', { status: 404, statusText: 'Not Found' });
    }
    const body = files[url];
    return new Response(typeof body === 'string' ? body : JSON.stringify(body));
  });
}

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

describe('projectUrlLoader', () => {
  it('loads the project file and its code, without auto-run', async () => {
    serve({ [URL_]: project, [`${BASE}/fapar.py`]: 'print("fapar")' });

    await expect(projectUrlLoader.load(URL_, {})).resolves.toEqual({
      autoRun: false,
      incompatibilities: [],
      seed: {
        name: 'FAPAR',
        collectionId: 'sentinel-2-l2a',
        temporalRange: ['2025-05-10', '2025-05-12'],
        propertyFilters: [],
        bands: ['B03', 'B04'],
        boundingBox: [14.09, 45.174, 14.27, 45.25],
        suggestedAlgorithm: 'print("fapar")'
      }
    });
  });

  it('passes the abort signal to both fetches', async () => {
    serve({ [URL_]: project, [`${BASE}/fapar.py`]: '' });
    const { signal } = new AbortController();
    await projectUrlLoader.load(URL_, { signal });
    expect(fetchMock).toHaveBeenCalledWith(URL_, { signal });
    expect(fetchMock).toHaveBeenCalledWith(`${BASE}/fapar.py`, { signal });
  });

  it('rejects a response that is not JSON', async () => {
    serve({ [URL_]: '<!doctype html><html></html>' });
    const error = await projectUrlLoader.load(URL_, {}).catch((e) => e);
    expect(error).toBeInstanceOf(NotFound);
    expect(error.message).toBe(`Invalid project file at ${URL_}: not JSON`);
  });

  it('reads the property filters of the project file', async () => {
    const filters = [
      { property: 'sat:orbit_state', operator: 'eq', value: 'ascending' }
    ];
    serve({
      [URL_]: { ...project, propertyFilters: filters },
      [`${BASE}/fapar.py`]: ''
    });
    const { seed } = await projectUrlLoader.load(URL_, {});
    expect(seed.propertyFilters).toEqual(filters);
  });

  it('converts a cloud cover from the project file to a filter', async () => {
    serve({
      [URL_]: { ...project, cloudCover: 30 },
      [`${BASE}/fapar.py`]: ''
    });
    const { seed } = await projectUrlLoader.load(URL_, {});
    expect(seed.propertyFilters).toEqual([
      { property: 'eo:cloud_cover', operator: 'lt', value: 30 }
    ]);
  });

  it('leaves out and names a malformed bounding box', async () => {
    serve({
      [URL_]: { ...project, boundingBox: [1, 'x'] },
      [`${BASE}/fapar.py`]: ''
    });
    const { seed, incompatibilities } = await projectUrlLoader.load(URL_, {});
    expect(seed.boundingBox).toBeUndefined();
    expect(incompatibilities).toEqual(['Bounding box [1,"x"] is not valid.']);
  });

  it('resolves a parent-relative code path', async () => {
    const shared = 'https://raw.example/algorithm_catalog/p/fapar/shared/x.py';
    serve({
      [URL_]: { ...project, algorithm: '../shared/x.py' },
      [shared]: ''
    });
    await projectUrlLoader.load(URL_, {});
    expect(fetchMock).toHaveBeenLastCalledWith(shared, expect.anything());
  });

  it('uses an absolute code URL as is', async () => {
    const other = 'https://other.example/x.py';
    serve({ [URL_]: { ...project, algorithm: other }, [other]: '' });
    await projectUrlLoader.load(URL_, {});
    expect(fetchMock).toHaveBeenLastCalledWith(other, expect.anything());
  });

  it.each(['name', 'collectionId', 'temporalRange', 'bands', 'algorithm'])(
    'rejects a project file missing %s',
    async (field) => {
      const broken: Record<string, unknown> = { ...project };
      delete broken[field];
      serve({ [URL_]: broken });
      const error = await projectUrlLoader.load(URL_, {}).catch((e) => e);
      expect(error).toBeInstanceOf(NotFound);
      expect(error.message).toBe(
        `Invalid project file at ${URL_}: missing \`${field}\``
      );
    }
  );

  it('rejects a malformed temporal range', async () => {
    serve({ [URL_]: { ...project, temporalRange: ['2025-05-10'] } });
    await expect(projectUrlLoader.load(URL_, {})).rejects.toThrow(
      `Invalid project file at ${URL_}: missing \`temporalRange\``
    );
  });

  it('rejects when the code file is missing', async () => {
    serve({ [URL_]: project });
    await expect(projectUrlLoader.load(URL_, {})).rejects.toThrow(
      `Failed to fetch ${BASE}/fapar.py: 404`
    );
  });

  it('rejects when the project file is missing', async () => {
    serve({});
    await expect(projectUrlLoader.load(URL_, {})).rejects.toThrow(
      `Failed to fetch ${URL_}: 404`
    );
  });
});
