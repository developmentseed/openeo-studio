import { useEffect, useState } from 'react';

import {
  getCollectionQueryables,
  type CollectionQueryables
} from '$utils/openeo/queryables';

/**
 * Returns the queryables of the collection. `queryables` is `null` while
 * loading (`isLoading`), and when the backend has no queryables endpoint.
 */
export function useCollectionQueryables(collectionId: string): {
  queryables: CollectionQueryables | null;
  isLoading: boolean;
} {
  const [result, setResult] = useState<{
    collectionId: string;
    queryables: CollectionQueryables | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCollectionQueryables(collectionId).then((queryables) => {
      if (!cancelled) setResult({ collectionId, queryables });
    });
    return () => {
      cancelled = true;
    };
  }, [collectionId]);

  const isLoading = result?.collectionId !== collectionId;
  return { queryables: isLoading ? null : result.queryables, isLoading };
}
