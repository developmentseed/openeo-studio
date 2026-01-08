/**
 * OpenEO Collections Discovery Service
 *
 * Provides hooks for fetching and managing OpenEO collections metadata.
 * Integrates with stac-react for consistent data fetching patterns.
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from 'react-oidc-context';
import type { StacCollection } from 'stac-ts';

// OpenEO API constants
const OPENEO_API_URL = 'https://api.explorer.eopf.copernicus.eu/openeo';

interface OpenEOCollectionsResponse {
  collections: StacCollection[];
  links: Array<{
    rel: string;
    href: string;
    type?: string;
  }>;
}

/**
 * Fetches all available OpenEO collections with authentication.
 *
 * @param authToken - Bearer token for authentication
 * @returns Promise resolving to collections response
 */
async function fetchOpenEOCollections(
  authToken?: string
): Promise<OpenEOCollectionsResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (authToken) {
    headers.Authorization = `Bearer oidc/oidc/${authToken}`;
  }

  const response = await fetch(`${OPENEO_API_URL}/collections`, {
    method: 'GET',
    headers
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch OpenEO collections: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Hook for fetching all available OpenEO collections.
 * Provides collection discovery functionality with caching.
 *
 * @returns Query result with collections data, loading state, and error handling
 *
 * @example
 * ```tsx
 * function CollectionBrowser() {
 *   const { data: collectionsResponse, isLoading, error } = useOpenEOCollections();
 *
 *   if (isLoading) return <div>Loading collections...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *
 *   return (
 *     <div>
 *       {collectionsResponse?.collections.map(collection => (
 *         <div key={collection.id}>{collection.title}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useOpenEOCollections() {
  const auth = useAuth();
  const authToken = auth.user?.access_token;

  return useQuery({
    queryKey: ['openeo-collections', authToken],
    queryFn: () => fetchOpenEOCollections(authToken),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error.message.includes('401') || error.message.includes('403')) {
        return false;
      }
      return failureCount < 3;
    }
  });
}

/**
 * Extract collection summaries for display in collection browser.
 *
 * @param collections - Array of STAC collections
 * @returns Simplified collection metadata for UI display
 */
export function extractCollectionSummaries(collections: StacCollection[]) {
  return collections.map((collection) => ({
    id: collection.id,
    title: collection.title || collection.id,
    description: collection.description,
    thumbnail: collection.assets?.thumbnail?.href,
    keywords: collection.keywords || [],
    spatialExtent: collection.extent?.spatial?.bbox?.[0],
    temporalExtent: collection.extent?.temporal?.interval?.[0],
    license: collection.license,
    providers: collection.providers
  }));
}
