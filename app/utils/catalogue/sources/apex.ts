/**
 * Lists the studio projects in the APEx Algorithm Catalogue repo. One
 * GitHub API call finds every `openeo_studio/project.json`; the files
 * themselves come from raw.githubusercontent.com, which isn't subject to the
 * API's 60 requests/hour limit. Entries open through the project-URL loader.
 */
import { fetchPublic } from '$utils/api';
import { matchesQuery, paginate } from '../paginate';
import type { CatalogueEntry, CatalogueSource } from '../types';

interface ApexConfig {
  owner: string;
  repo: string;
  ref: string;
}

const PROJECT_PATH =
  /^algorithm_catalog\/([^/]+)\/([^/]+)\/openeo_studio\/project\.json$/;
const CACHE_TTL_MS = 3_600_000;

export function findStudioProjects(paths: string[]) {
  const all = new Set(paths);
  return paths.flatMap((path) => {
    const match = path.match(PROJECT_PATH);
    if (!match) return [];
    const [, provider, algo] = match;
    const thumbnailPath = `algorithm_catalog/${provider}/${algo}/records/thumbnail.png`;
    return [
      {
        provider,
        algo,
        path,
        ...(all.has(thumbnailPath) && { thumbnailPath })
      }
    ];
  });
}

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

export function createApexSource(config: ApexConfig): CatalogueSource {
  const { owner, repo, ref } = config;
  const raw = `https://raw.githubusercontent.com/${owner}/${repo}/${ref}`;
  const cacheKey = `apex-catalogue:${owner}/${repo}@${ref}`;
  let inflight: Promise<CatalogueEntry[]> | undefined;

  async function loadAll(): Promise<CatalogueEntry[]> {
    const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`;
    const tree = await (await fetchPublic(treeUrl)).json();
    if (tree.truncated) {
      // eslint-disable-next-line no-console
      console.warn(
        '[catalogue] apex: GitHub tree is truncated; list is partial'
      );
    }

    const projects = findStudioProjects(
      (tree.tree ?? []).map((node: { path: string }) => node.path)
    );

    const settled = await Promise.allSettled(
      projects.map(async (p): Promise<CatalogueEntry> => {
        const url = `${raw}/${p.path}`;
        const file = await (await fetchPublic(url)).json();
        return {
          id: `${p.provider}/${p.algo}`,
          name: file.name,
          description: file.description ?? '',
          collectionId: file.collectionId,
          bands: file.defaultBands,
          thumbnail: p.thumbnailPath && `${raw}/${p.thumbnailPath}`,
          tags: [p.provider],
          open: { loader: 'project-url', ref: url }
        };
      })
    );

    const entries = settled.flatMap((result, i) => {
      if (result.status === 'fulfilled') return [result.value];
      // eslint-disable-next-line no-console
      console.warn(
        `[catalogue] apex: skipped ${projects[i].path}`,
        result.reason
      );
      return [];
    });
    if (projects.length > 0 && entries.length === 0) {
      throw new Error('No APEx project file could be loaded');
    }
    // A partial list (some files failed) is shown but not cached, so the
    // next listing tries the missing files again.
    if (entries.length === projects.length) writeCache(cacheKey, entries);
    return entries;
  }

  return {
    id: 'apex',
    label: 'APEx',
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
