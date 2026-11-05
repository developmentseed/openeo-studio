/**
 * The catalogue: fans listing out to sources, routes loading to loaders,
 * and checks every entry against the connected backend on the way out.
 */
import { APIError } from '$utils/api';
import { NotFound } from '$utils/errors';
import { checkCompatibility } from './compatibility';
import type {
  CatalogueContext,
  CatalogueEntry,
  CatalogueQuery,
  CatalogueSource,
  ListResult,
  LoadRef,
  LoadResult,
  ProjectLoader,
  SourcePage
} from './types';

export class IncompatibleProjectError extends NotFound {
  reason: string;

  constructor(reason: string) {
    super(
      `This project isn't compatible with the connected backend: ${reason}`
    );
    this.name = 'IncompatibleProjectError';
    this.reason = reason;
  }
}

/**
 * Whether an error means the thing doesn't exist, as opposed to a failure
 * that might go away on retry.
 */
export const isNotFound = (error: unknown) =>
  error instanceof NotFound ||
  (error instanceof APIError && error.code === 404);

export interface Catalogue {
  sources: { id: string; label: string }[];
  listEntries(
    query: CatalogueQuery,
    ctx: CatalogueContext,
    sourceIds?: string[]
  ): Promise<SourcePage[]>;
  loadMore(
    sourceId: string,
    query: CatalogueQuery,
    ctx: CatalogueContext,
    cursor: string
  ): Promise<SourcePage>;
  load(open: LoadRef, ctx: CatalogueContext): Promise<LoadResult>;
}

/**
 * Filters out catalogue entries that aren't compatible with the connected
 * backend. Compatibility is determined by the collection and bands used in the
 * entry, which must exist on the backend.
 *
 * @param sourceId Id of the catalogue source, for logging
 * @param entries Entries to filter
 * @param ctx Catalogue context, including the user auth token
 *
 * @returns A promise that resolves to the filtered entries
 */
async function compatibleOnly(
  sourceId: string,
  entries: CatalogueEntry[],
  ctx: CatalogueContext
): Promise<CatalogueEntry[]> {
  const checks = await Promise.all(
    entries.map((entry) =>
      entry.collectionId
        ? checkCompatibility(
            { collectionId: entry.collectionId, bands: entry.bands ?? [] },
            ctx.authToken
          )
        : { compatible: true as const }
    )
  );
  return entries.filter((entry, i) => {
    const check = checks[i];
    if (check.compatible) return true;
    // eslint-disable-next-line no-console
    console.warn(
      `[catalogue] ${sourceId}: dropped incompatible entry ${entry.id}: ${check.reason}`
    );
    return false;
  });
}

/**
 * Loads a page of catalogue entries from a source, filtering out incompatible
 * entries and catching errors.
 *
 * @param source The catalogue source to load from
 * @param list Function that returns a promise for the list result
 * @param ctx Catalogue context, including the user auth token
 *
 * @returns A promise that resolves to a source page, with items and optional
 * next cursor or error
 */
async function page(
  source: CatalogueSource,
  list: () => Promise<ListResult>,
  ctx: CatalogueContext
): Promise<SourcePage> {
  try {
    const { items, nextCursor } = await list();
    return {
      sourceId: source.id,
      items: await compatibleOnly(source.id, items, ctx),
      ...(nextCursor && { nextCursor })
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`[catalogue] source "${source.id}" failed`, error);
    return { sourceId: source.id, items: [], error };
  }
}

/**
 * Creates a catalogue instance with the specified configuration.
 *
 * @param config Configuration object with sources and loaders
 * @returns A catalogue instance with methods to list entries and load projects.
 */
export function createCatalogue(config: {
  sources: CatalogueSource[];
  loaders: ProjectLoader[];
}): Catalogue {
  const sourcesById = new Map(config.sources.map((s) => [s.id, s]));
  const loadersById = new Map(config.loaders.map((l) => [l.id, l]));

  return {
    sources: config.sources.map(({ id, label }) => ({ id, label })),

    listEntries(query, ctx, sourceIds) {
      const targets = sourceIds
        ? config.sources.filter((s) => sourceIds.includes(s.id))
        : config.sources;
      return Promise.all(
        targets.map((s) => page(s, () => s.listEntries(query, ctx), ctx))
      );
    },

    async loadMore(sourceId, query, ctx, cursor) {
      const source = sourcesById.get(sourceId);
      if (!source) throw new Error(`Unknown source: ${sourceId}`);
      return page(source, () => source.listEntries(query, ctx, cursor), ctx);
    },

    async load(open, ctx) {
      const loader = loadersById.get(open.loader);
      if (!loader) throw new Error(`Unknown loader: ${open.loader}`);

      const result = await loader.load(open.ref, ctx);
      const check = await checkCompatibility(
        {
          collectionId: result.seed.collectionId,
          bands: result.seed.defaultBands
        },
        ctx.authToken
      );
      if (!check.compatible) throw new IncompatibleProjectError(check.reason);
      return result;
    }
  };
}
