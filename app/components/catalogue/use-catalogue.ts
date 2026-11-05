import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from 'react-oidc-context';

import { catalogue } from '$config/catalogue';
import type { CatalogueEntry, SourcePage } from '$utils/catalogue/types';

interface CatalogueViewQuery {
  text: string;
  sourceIds?: string[];
}

/**
 * The catalogue feed for one query: every source's pages merged in source
 * order, with per-source errors and cursors. Each source is listed on its
 * own, so a slow one never holds back the others. A query change discards
 * any response still in flight for the previous query.
 */
export function useCatalogue(query: CatalogueViewQuery) {
  const { user } = useAuth();
  const authToken = user?.access_token;
  // One slot per listed source, in source order; null until it answers.
  const [slots, setSlots] = useState<(SourcePage | null)[]>([]);
  const generation = useRef(0);

  const sourceKey = query.sourceIds?.join(',');
  // Stable across renders with an equal query.
  const stableQuery = useMemo(() => query, [query.text, sourceKey]);

  useEffect(() => {
    const current = ++generation.current;
    const targets = stableQuery.sourceIds ?? catalogue.sources.map((s) => s.id);
    setSlots(targets.map(() => null));
    targets.forEach((sourceId, i) => {
      catalogue
        .listEntries({ text: stableQuery.text }, { authToken }, [sourceId])
        .then(([page]) => {
          if (current !== generation.current || !page) return;
          setSlots((prev) => prev.map((slot, j) => (j === i ? page : slot)));
        });
    });
  }, [stableQuery, authToken]);

  const pages = useMemo(
    () => slots.filter((slot): slot is SourcePage => slot !== null),
    [slots]
  );
  const isLoading = slots.length === 0 || slots.includes(null);

  const loadMore = useCallback(async () => {
    const current = generation.current;
    const updates = await Promise.all(
      slots.map((page) =>
        page?.nextCursor
          ? catalogue
              .loadMore(
                page.sourceId,
                { text: stableQuery.text },
                { authToken },
                page.nextCursor
              )
              .then((next) => ({
                ...next,
                items: [...page.items, ...next.items]
              }))
          : page
      )
    );
    if (current === generation.current) setSlots(updates);
  }, [slots, stableQuery, authToken]);

  const retry = useCallback(
    async (sourceId: string) => {
      const current = generation.current;
      const [page] = await catalogue.listEntries(
        { text: stableQuery.text },
        { authToken },
        [sourceId]
      );
      if (page && current === generation.current) {
        setSlots((prev) =>
          prev.map((p) => (p?.sourceId === sourceId ? page : p))
        );
      }
    },
    [stableQuery, authToken]
  );

  const entries = useMemo(
    () =>
      pages.flatMap((page) =>
        page.items.map((entry: CatalogueEntry) => ({
          sourceId: page.sourceId,
          entry
        }))
      ),
    [pages]
  );
  const errors = useMemo(
    () =>
      pages
        .filter((page) => page.error !== undefined)
        .map(({ sourceId, error }) => ({ sourceId, error })),
    [pages]
  );

  return {
    entries,
    errors,
    isLoading,
    hasMore: pages.some((page) => !!page.nextCursor),
    loadMore,
    retry
  };
}
