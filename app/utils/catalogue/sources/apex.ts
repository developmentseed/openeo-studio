/**
 * Lists the studio projects in the APEx Algorithm Catalogue repo: every
 * `openeo_studio/project.json`. Entries open through the project-URL loader.
 */
import { type ApexConfig, apexRawUrl, createTreeSource } from '../apex/repo';
import type { CatalogueSource } from '../types';

const PROJECT_PATH =
  /^algorithm_catalog\/([^/]+)\/([^/]+)\/openeo_studio\/project\.json$/;

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

export function createApexSource(config: ApexConfig): CatalogueSource {
  const raw = apexRawUrl(config);
  return createTreeSource(config, {
    id: 'apex',
    label: 'APEx',
    find: findStudioProjects,
    emptyMessage: 'No APEx project file could be loaded',
    toEntry: (p, file, url) => ({
      id: `${p.provider}/${p.algo}`,
      name: file.name,
      description: file.description ?? '',
      collectionId: file.collectionId,
      bands: file.bands,
      thumbnail: p.thumbnailPath && `${raw}/${p.thumbnailPath}`,
      tags: [p.provider],
      open: { loader: 'project-url', ref: url }
    })
  });
}
