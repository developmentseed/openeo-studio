import { matchesQuery, paginate } from '$utils/catalogue/paginate';
import type { CatalogueEntry } from '$utils/catalogue/types';

const entry = (over: Partial<CatalogueEntry> = {}): CatalogueEntry => ({
  id: 'e',
  name: 'Forest Fire',
  description: 'Burned area mapping',
  open: { loader: 'l', ref: 'r' },
  ...over
});

describe('paginate', () => {
  const items = Array.from({ length: 45 }, (_, i) => i);

  it('pages through items with an opaque cursor', () => {
    const first = paginate(items, { pageSize: 20 });
    expect(first.items).toHaveLength(20);
    expect(first.nextCursor).toBeDefined();

    const second = paginate(items, { pageSize: 20 }, first.nextCursor);
    expect(second.items[0]).toBe(20);
    expect(second.items).toHaveLength(20);

    const third = paginate(items, { pageSize: 20 }, second.nextCursor);
    expect(third.items).toEqual([40, 41, 42, 43, 44]);
    expect(third.nextCursor).toBeUndefined();
  });

  it('defaults to 20 items per page', () => {
    expect(paginate(items, {}).items).toHaveLength(20);
  });

  it('returns no cursor when everything fits', () => {
    expect(paginate([1, 2], {}).nextCursor).toBeUndefined();
  });
});

describe('matchesQuery', () => {
  it('matches everything with an empty query', () => {
    expect(matchesQuery(entry(), {})).toBe(true);
  });

  it('matches text case-insensitively in name and description', () => {
    expect(matchesQuery(entry(), { text: 'forest' })).toBe(true);
    expect(matchesQuery(entry(), { text: 'BURNED' })).toBe(true);
    expect(matchesQuery(entry(), { text: 'flood' })).toBe(false);
  });

  it('requires every query tag', () => {
    const tagged = entry({ tags: ['a', 'b'] });
    expect(matchesQuery(tagged, { tags: ['a', 'b'] })).toBe(true);
    expect(matchesQuery(entry({ tags: ['a'] }), { tags: ['a', 'b'] })).toBe(
      false
    );
  });
});
