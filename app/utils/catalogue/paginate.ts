import type { CatalogueEntry, CatalogueQuery, ListResult } from './types';

const DEFAULT_PAGE_SIZE = 20;

/**
 * Pages an in-memory array. The cursor is an offset into `items`, so it is
 * only valid when replayed with the query that produced it.
 */
export function paginate<T>(
  items: T[],
  query: CatalogueQuery,
  cursor?: string
): ListResult<T> {
  const offset = cursor ? Number(cursor) : 0;
  const end = offset + (query.pageSize ?? DEFAULT_PAGE_SIZE);
  return {
    items: items.slice(offset, end),
    nextCursor: end < items.length ? String(end) : undefined
  };
}

export function matchesQuery(
  entry: CatalogueEntry,
  query: CatalogueQuery
): boolean {
  const text = query.text?.trim().toLowerCase();
  if (
    text &&
    !`${entry.name} ${entry.description}`.toLowerCase().includes(text)
  ) {
    return false;
  }
  return (query.tags ?? []).every((tag) => entry.tags?.includes(tag));
}
