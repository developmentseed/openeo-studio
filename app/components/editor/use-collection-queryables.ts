import { useEffect, useState } from 'react';

import {
  getCollectionQueryables,
  type CollectionQueryables
} from '$utils/openeo/queryables';

/**
 * Returns the queryables of the collection. Returns `null` while loading, and
 * when the backend has no queryables endpoint.
 */
export function useCollectionQueryables(
  collectionId: string
): CollectionQueryables | null {
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

  return result?.collectionId === collectionId ? result.queryables : null;
}
