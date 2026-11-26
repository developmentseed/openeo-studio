/**
 * The APEx Algorithm Catalogue repo on GitHub, shared by everything that
 * reads it: where its files are, and a source that lists entries from them.
 * One GitHub API call lists the whole repo; the files themselves come from
 * raw.githubusercontent.com, which isn't subject to the API's 60
 * requests/hour limit.
 */
import { fetchPublic } from '$utils/api';
import { matchesQuery, paginate } from '../paginate';
import type { CatalogueEntry, CatalogueSource } from '../types';

export interface ApexConfig {
  owner: string;
  repo: string;
  ref: string;
}

export const apexRawUrl = ({ owner, repo, ref }: ApexConfig) =>
  `https://raw.githubusercontent.com/${owner}/${repo}/${ref}`;

const CACHE_TTL_MS = 3_600_000;

function readCache(key: string): CatalogueEntry[] | undefined {
  try {
    const cached = JSON.parse(sessionStorage.getItem(key) ?? 'null');
    if (cached && Date.now() - cached.savedAt < CACHE_TTL_MS) {
      return cached.entries;
    }
  } catch {
    // Missing storage or corrupt JSON: fall through to the network.
  }
  return undefined;
}

function writeCache(key: string, entries: CatalogueEntry[]) {
  try {
    sessionStorage.setItem(
      key,
      JSON.stringify({ savedAt: Date.now(), entries })
    );
  } catch {
    // shortcut: with storage blocked every listing refetches; add an
    // in-memory copy if that ever matters.
  }
}

// The APEx sources list from the same tree: calls that overlap share a request.
const treeRequests = new Map<string, Promise<string[]>>();

function fetchTreePaths({ owner, repo, ref }: ApexConfig): Promise<string[]> {
  const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`;
  let request = treeRequests.get(url);
  if (!request) {
    request = fetchPublic(url)
      .then((response) => response.json())
      .then((tree) => {
        if (tree.truncated) {
          // eslint-disable-next-line no-console
          console.warn(
            '[catalogue] apex: GitHub tree is truncated; list is partial'
          );
        }
        return (tree.tree ?? []).map((node: { path: string }) => node.path);
      })
      .finally(() => treeRequests.delete(url));
    treeRequests.set(url, request);
  }
  return request;
}

interface TreeSourceOptions<T extends { path: string }> {
  id: string;
  label: string;
  /** Picks the files of the repo that describe an entry. */
  find(paths: string[]): T[];
  /** The entry of a file, or undefined when the file is not one. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toEntry(item: T, json: any, url: string): CatalogueEntry | undefined;
  /** The error when no file could be loaded. */
  emptyMessage: string;
}

/**
 * A source that lists one entry per matching JSON file of the APEx repo. It
 * caches the entries for the session, and never caches a partial list.
 */
export function createTreeSource<T extends { path: string }>(
  config: ApexConfig,
  options: TreeSourceOptions<T>
): CatalogueSource {
  const { id, label, find, toEntry, emptyMessage } = options;
  const raw = apexRawUrl(config);
  const cacheKey = `${id}-catalogue:${config.owner}/${config.repo}@${config.ref}`;
  let inflight: Promise<CatalogueEntry[]> | undefined;

  async function loadAll(): Promise<CatalogueEntry[]> {
    const items = find(await fetchTreePaths(config));

    const settled = await Promise.allSettled(
      items.map(async (item) => {
        const url = `${raw}/${item.path}`;
        return toEntry(item, await (await fetchPublic(url)).json(), url);
      })
    );

    const failed = settled.filter((result, i) => {
      if (result.status === 'fulfilled') return false;
      // eslint-disable-next-line no-console
      console.warn(
        `[catalogue] ${id}: skipped ${items[i].path}`,
        result.reason
      );
      return true;
    });
    if (items.length > 0 && failed.length === items.length) {
      throw new Error(emptyMessage);
    }
    const entries = settled.flatMap((result) =>
      result.status === 'fulfilled' && result.value ? [result.value] : []
    );
    // A partial list (some files failed) is shown but not cached, so the
    // next listing tries the missing files again.
    if (failed.length === 0) writeCache(cacheKey, entries);
    return entries;
  }

  return {
    id,
    label,
    async listEntries(query, _ctx, cursor) {
      let all = readCache(cacheKey);

      if (!all) {
        // Calls that arrive while a fetch is running wait for that fetch
        // instead of starting another one.
        if (!inflight) {
          inflight = loadAll();
        }
        try {
          all = await inflight;
        } finally {
          inflight = undefined;
        }
      }

      const entries = all.filter((e) => matchesQuery(e, query));
      return paginate(entries, query, cursor);
    }
  };
}
