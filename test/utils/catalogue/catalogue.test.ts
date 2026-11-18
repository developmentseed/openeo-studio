jest.mock('$utils/catalogue/compatibility', () => ({
  checkCompatibility: jest.fn(),
  reconcileSeed: jest.fn()
}));

import {
  checkCompatibility,
  reconcileSeed
} from '$utils/catalogue/compatibility';
import { createCatalogue, isNotFound } from '$utils/catalogue/catalogue';
import { APIError } from '$utils/api';
import type {
  CatalogueEntry,
  CatalogueSource,
  LoadResult,
  ProjectLoader
} from '$utils/catalogue/types';
import { NotFound } from '$utils/errors';

const check = checkCompatibility as jest.Mock;
const reconcile = reconcileSeed as jest.Mock;

const entry = (id: string, over: Partial<CatalogueEntry> = {}) => ({
  id,
  name: id,
  description: '',
  open: { loader: 'fake', ref: id },
  ...over
});

const source = (
  id: string,
  listEntries: CatalogueSource['listEntries']
): CatalogueSource => ({ id, label: id.toUpperCase(), listEntries });

const result: LoadResult = {
  seed: {
    name: 'x',
    collectionId: 'col',
    temporalRange: ['2025-01-01', '2025-01-02'],
    propertyFilters: [],
    bands: ['B04']
  },
  autoRun: false
};

const loader: ProjectLoader = { id: 'fake', load: jest.fn(async () => result) };

beforeEach(() => {
  check.mockReset();
  check.mockResolvedValue({ compatible: true });
  reconcile.mockReset();
  reconcile.mockImplementation(async (seed) => ({
    seed,
    incompatibilities: []
  }));
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe('isNotFound', () => {
  it('is true for NotFound and an HTTP 404', () => {
    expect(isNotFound(new NotFound('x'))).toBe(true);
    expect(isNotFound(new APIError('x', 404, 'Not Found'))).toBe(true);
  });

  it('is false for other failures', () => {
    expect(isNotFound(new APIError('x', 503, 'Unavailable'))).toBe(false);
    expect(isNotFound(new TypeError('Failed to fetch'))).toBe(false);
    expect(isNotFound(undefined)).toBe(false);
  });
});

describe('createCatalogue', () => {
  it('exposes source ids and labels', () => {
    const catalogue = createCatalogue({
      sources: [source('a', async () => ({ items: [] }))],
      loaders: []
    });
    expect(catalogue.sources).toEqual([{ id: 'a', label: 'A' }]);
  });

  it('isolates a failing source', async () => {
    const boom = new Error('boom');
    const catalogue = createCatalogue({
      sources: [
        source('a', async () => {
          throw boom;
        }),
        source('b', async () => ({ items: [entry('b1')], nextCursor: 'c' }))
      ],
      loaders: []
    });

    const pages = await catalogue.listEntries({}, {});
    expect(pages).toEqual([
      { sourceId: 'a', items: [], error: boom },
      { sourceId: 'b', items: [entry('b1')], nextCursor: 'c' }
    ]);
  });

  it('lists only the requested sources', async () => {
    const a = jest.fn(async () => ({ items: [] }));
    const b = jest.fn(async () => ({ items: [] }));
    const catalogue = createCatalogue({
      sources: [source('a', a), source('b', b)],
      loaders: []
    });

    await catalogue.listEntries({}, {}, ['b']);
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalled();
  });

  it('drops incompatible entries with a warning', async () => {
    check.mockImplementation(async ({ collectionId }) =>
      collectionId === 'bad'
        ? { compatible: false, reason: 'nope' }
        : { compatible: true }
    );
    const catalogue = createCatalogue({
      sources: [
        source('a', async () => ({
          items: [
            entry('ok', { collectionId: 'good', bands: ['B04'] }),
            entry('ko', { collectionId: 'bad' })
          ]
        }))
      ],
      loaders: []
    });

    const [page] = await catalogue.listEntries({}, { authToken: 't' });
    expect(page.items.map((e) => e.id)).toEqual(['ok']);
    expect(check).toHaveBeenCalledWith(
      { collectionId: 'good', bands: ['B04'] },
      't'
    );
    expect(check).toHaveBeenCalledWith({ collectionId: 'bad', bands: [] }, 't');
    const message = (console.warn as jest.Mock).mock.calls[0].join(' ');
    expect(message).toContain('a');
    expect(message).toContain('ko');
    expect(message).toContain('nope');
  });

  it('keeps entries without a collection and skips their check', async () => {
    const catalogue = createCatalogue({
      sources: [source('a', async () => ({ items: [entry('free')] }))],
      loaders: []
    });

    const [page] = await catalogue.listEntries({}, {});
    expect(page.items).toHaveLength(1);
    expect(check).not.toHaveBeenCalled();
  });

  it('turns a failing check into a page error', async () => {
    const boom = new Error('network');
    check.mockRejectedValue(boom);
    const catalogue = createCatalogue({
      sources: [
        source('a', async () => ({
          items: [entry('x', { collectionId: 'c' })]
        }))
      ],
      loaders: []
    });

    const [page] = await catalogue.listEntries({}, {});
    expect(page).toEqual({ sourceId: 'a', items: [], error: boom });
  });

  it('continues one source with its cursor', async () => {
    const list = jest.fn(async () => ({ items: [entry('p2')] }));
    const catalogue = createCatalogue({
      sources: [source('a', list)],
      loaders: []
    });

    const page = await catalogue.loadMore('a', { text: 'q' }, {}, 'cur');
    expect(list).toHaveBeenCalledWith({ text: 'q' }, {}, 'cur');
    expect(page).toEqual({ sourceId: 'a', items: [entry('p2')] });
  });

  it('rejects an unknown loader', async () => {
    const catalogue = createCatalogue({ sources: [], loaders: [] });
    await expect(
      catalogue.load({ loader: 'nope', ref: 'x' }, {})
    ).rejects.toThrow('Unknown loader: nope');
  });

  it('loads an incompatible seed, names the values, and stops auto-run', async () => {
    const supported = { ...result.seed, bands: [] };
    reconcile.mockResolvedValue({
      seed: supported,
      incompatibilities: ['no B04']
    });
    const autoRunLoader: ProjectLoader = {
      id: 'fake',
      load: jest.fn(async () => ({
        ...result,
        autoRun: true,
        incompatibilities: ['bad box']
      }))
    };
    const catalogue = createCatalogue({
      sources: [],
      loaders: [autoRunLoader]
    });

    await expect(
      catalogue.load({ loader: 'fake', ref: 'x' }, { authToken: 't' })
    ).resolves.toEqual({
      seed: supported,
      autoRun: false,
      incompatibilities: ['bad box', 'no B04']
    });
    expect(reconcile).toHaveBeenCalledWith(result.seed, 't');
  });

  it('returns a compatible load result unchanged', async () => {
    const catalogue = createCatalogue({ sources: [], loaders: [loader] });
    await expect(
      catalogue.load({ loader: 'fake', ref: 'x' }, {})
    ).resolves.toBe(result);
  });
});
