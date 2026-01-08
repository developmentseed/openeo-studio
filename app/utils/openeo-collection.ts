/**
 * OpenEO Collection Service
 *
 * Provides hooks for fetching individual OpenEO collection metadata.
 * Replaces STAC item dependencies with collection-level data fetching.
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from 'react-oidc-context';
import type { StacCollection } from 'stac-ts';

// OpenEO API constants
const OPENEO_API_URL = 'https://api.explorer.eopf.copernicus.eu/openeo';

/**
 * Fetches a specific OpenEO collection by ID with authentication.
 *
 * @param collectionId - The collection identifier
 * @param authToken - Bearer token for authentication
 * @returns Promise resolving to collection metadata
 */
async function fetchOpenEOCollection(
  collectionId: string,
  authToken?: string
): Promise<StacCollection> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (authToken) {
    headers.Authorization = `Bearer oidc/oidc/${authToken}`;
  }

  const response = await fetch(
    `${OPENEO_API_URL}/collections/${collectionId}`,
    {
      method: 'GET',
      headers
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch OpenEO collection '${collectionId}': ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Hook for fetching a specific OpenEO collection by ID.
 * Replaces useItem from stac-react for collection-based workflows.
 *
 * @param collectionId - The collection identifier to fetch
 * @returns Query result with collection data, loading state, and error handling
 *
 * @example
 * ```tsx
 * function CollectionDetails({ collectionId }: { collectionId: string }) {
 *   const { data: collection, isLoading, error } = useOpenEOCollection(collectionId);
 *
 *   if (isLoading) return <div>Loading collection...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   if (!collection) return <div>Collection not found</div>;
 *
 *   return (
 *     <div>
 *       <h2>{collection.title}</h2>
 *       <p>{collection.description}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useOpenEOCollection(collectionId: string | null | undefined) {
  const auth = useAuth();
  const authToken = auth.user?.access_token;

  return useQuery({
    queryKey: ['openeo-collection', collectionId, authToken],
    queryFn: () => {
      if (!collectionId) {
        throw new Error('Collection ID is required');
      }
      return fetchOpenEOCollection(collectionId, authToken);
    },
    enabled: !!collectionId, // Only run query if collectionId is provided
    staleTime: 10 * 60 * 1000, // 10 minutes - collections change less frequently
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: (failureCount, error) => {
      // Don't retry on auth errors or not found
      if (
        error.message.includes('401') ||
        error.message.includes('403') ||
        error.message.includes('404')
      ) {
        return false;
      }
      return failureCount < 3;
    }
  });
}

/**
 * Extract essential collection metadata for UI display and processing.
 *
 * @param collection - STAC collection object
 * @returns Simplified collection metadata
 */
export function extractCollectionMetadata(collection: StacCollection) {
  return {
    id: collection.id,
    title: collection.title || collection.id,
    description: collection.description,
    thumbnail: collection.assets?.thumbnail?.href,
    keywords: collection.keywords || [],
    spatialExtent: collection.extent?.spatial?.bbox?.[0], // [west, south, east, north]
    temporalExtent: collection.extent?.temporal?.interval?.[0], // [start, end]
    license: collection.license,
    providers: collection.providers,
    // Extract cube dimensions for band information
    cubeDimensions: collection['cube:dimensions'],
    // Extract band summaries
    bandSummaries: collection.summaries?.bands
  };
}
