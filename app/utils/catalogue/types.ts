/**
 * Catalogue contracts. A source lists entries; a loader turns one entry's
 * reference into editor content. Each entry names the loader that opens it,
 * so listing and loading can come from different places.
 */
import type { EditorSeed } from '$types';

export interface CatalogueQuery {
  text?: string;
  tags?: string[];
  pageSize?: number; // hint; each source may clamp or ignore it
}

export interface CatalogueContext {
  authToken?: string;
  signal?: AbortSignal; // aborts a load the user has moved on from
}

export interface LoadRef {
  loader: string; // loader id
  ref: string; // opaque to everything except that loader
}

export interface CatalogueEntry {
  id: string; // unique within its source
  name: string;
  description: string;
  thumbnail?: string;
  // Entries without a collection skip the list-time compatibility check.
  collectionId?: string;
  bands?: string[];
  tags?: string[];
  open: LoadRef;
}

export interface ListResult<T = CatalogueEntry> {
  items: T[];
  nextCursor?: string;
}

export interface CatalogueSource {
  id: string;
  label: string;
  listEntries(
    query: CatalogueQuery,
    ctx: CatalogueContext,
    cursor?: string
  ): Promise<ListResult>;
}

export interface LoadResult {
  seed: EditorSeed;
  projectId?: string; // set only for saved projects
  autoRun: boolean;
  // Code that exists only in a link: unsaved, and written by someone else.
  external?: boolean;
  // The values left out of the seed, for the user to read.
  incompatibilities?: string[];
}

export interface ProjectLoader {
  id: string;
  load(ref: string, ctx: CatalogueContext): Promise<LoadResult>;
}

export interface SourcePage {
  sourceId: string;
  items: CatalogueEntry[];
  nextCursor?: string;
  error?: unknown; // set, with items empty, when this source failed
}
