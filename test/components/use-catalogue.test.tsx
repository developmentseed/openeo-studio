const mockListEntries = jest.fn();
const mockLoadMore = jest.fn();

jest.mock('$config/catalogue', () => ({
  catalogue: {
    sources: [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' }
    ],
    listEntries: (...args: unknown[]) => mockListEntries(...args),
    loadMore: (...args: unknown[]) => mockLoadMore(...args)
  }
}));
jest.mock('react-oidc-context', () => ({
  useAuth: () => ({ user: { access_token: 'tok' } })
}));

import { act, renderHook, waitFor } from '@testing-library/react';

import { useCatalogue } from '$components/catalogue/use-catalogue';

const entry = (id: string) => ({
  id,
  name: id,
  description: '',
  open: { loader: 'l', ref: id }
});

type Page = { sourceId: string; items: unknown[]; nextCursor?: string };

// Answers each per-source listEntries call with that source's page.
function serve(pages: Record<string, Page | Promise<Page>>) {
  mockListEntries.mockImplementation(
    async (_q: unknown, _c: unknown, ids: string[]) => [await pages[ids[0]]]
  );
}

const ids = (result: { current: ReturnType<typeof useCatalogue> }) =>
  result.current.entries.map((e) => `${e.sourceId}:${e.entry.id}`);

beforeEach(() => {
  mockListEntries.mockReset();
  mockLoadMore.mockReset();
});

describe('useCatalogue', () => {
  it('lists entries in source order, one call per source', async () => {
    serve({
      a: { sourceId: 'a', items: [entry('a1')] },
      b: { sourceId: 'b', items: [entry('b1'), entry('b2')] }
    });

    const { result } = renderHook(() => useCatalogue({ text: '' }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockListEntries).toHaveBeenCalledWith(
      { text: '' },
      { authToken: 'tok' },
      ['a']
    );
    expect(mockListEntries).toHaveBeenCalledWith(
      { text: '' },
      { authToken: 'tok' },
      ['b']
    );
    expect(ids(result)).toEqual(['a:a1', 'b:b1', 'b:b2']);
    expect(result.current.hasMore).toBe(false);
  });

  it('shows a fast source while a slow one is still loading', async () => {
    serve({
      a: new Promise<Page>(() => {}), // never settles
      b: { sourceId: 'b', items: [entry('b1')] }
    });

    const { result } = renderHook(() => useCatalogue({ text: '' }));

    await waitFor(() => expect(ids(result)).toEqual(['b:b1']));
    expect(result.current.isLoading).toBe(true);
  });

  it('loads more only from sources with a cursor', async () => {
    serve({
      a: { sourceId: 'a', items: [entry('a1')], nextCursor: 'ca' },
      b: { sourceId: 'b', items: [entry('b1')] }
    });
    mockLoadMore.mockResolvedValue({ sourceId: 'a', items: [entry('a2')] });

    const { result } = renderHook(() => useCatalogue({ text: 'x' }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.hasMore).toBe(true);

    await act(() => result.current.loadMore());

    expect(mockLoadMore).toHaveBeenCalledTimes(1);
    expect(mockLoadMore).toHaveBeenCalledWith(
      'a',
      { text: 'x' },
      { authToken: 'tok' },
      'ca'
    );
    expect(ids(result)).toEqual(['a:a1', 'a:a2', 'b:b1']);
    expect(result.current.hasMore).toBe(false);
  });

  it('reports failed sources and retries only them', async () => {
    const boom = new Error('rate limited');
    serve({
      a: { sourceId: 'a', items: [], error: boom } as Page,
      b: { sourceId: 'b', items: [entry('b1')] }
    });

    const { result } = renderHook(() => useCatalogue({ text: '' }));
    await waitFor(() =>
      expect(result.current.errors).toEqual([{ sourceId: 'a', error: boom }])
    );

    serve({ a: { sourceId: 'a', items: [entry('a1')] } });
    await act(() => result.current.retry('a'));

    expect(mockListEntries).toHaveBeenLastCalledWith(
      { text: '' },
      { authToken: 'tok' },
      ['a']
    );
    expect(result.current.errors).toEqual([]);
    expect(ids(result)).toEqual(['a:a1', 'b:b1']);
  });

  it('lists only the filtered sources', async () => {
    serve({ b: { sourceId: 'b', items: [entry('b1')] } });
    const { result } = renderHook(() =>
      useCatalogue({ text: '', sourceIds: ['b'] })
    );
    await waitFor(() => expect(ids(result)).toEqual(['b:b1']));
    expect(mockListEntries).toHaveBeenCalledTimes(1);
  });

  it('discards a response for an outdated query', async () => {
    let resolveOld!: (page: Page) => void;
    const old = new Promise<Page>((resolve) => (resolveOld = resolve));
    mockListEntries.mockImplementation(
      async (q: { text: string }, _c: unknown, sourceIds: string[]) =>
        q.text === 'old' && sourceIds[0] === 'a'
          ? [await old]
          : [
              {
                sourceId: sourceIds[0],
                items: [entry(`${q.text}-${sourceIds[0]}`)]
              }
            ]
    );

    const { result, rerender } = renderHook(
      ({ text }) => useCatalogue({ text }),
      { initialProps: { text: 'old' } }
    );
    rerender({ text: 'new' });
    await waitFor(() => expect(ids(result)).toEqual(['a:new-a', 'b:new-b']));

    await act(async () => {
      resolveOld({ sourceId: 'a', items: [entry('stale')] });
    });
    expect(ids(result)).toEqual(['a:new-a', 'b:new-b']);
  });
});
