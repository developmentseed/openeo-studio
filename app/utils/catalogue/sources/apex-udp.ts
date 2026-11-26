/**
 * Lists the APEx algorithms that have a UDP but no studio project, from
 * their catalogue records. Entries open through the `apex-udp` loader.
 */
import { titleOf, udpHref } from '../apex/record';
import { type ApexConfig, apexRawUrl, createTreeSource } from '../apex/repo';
import type { CatalogueSource } from '../types';

const RECORD_PATH = /^algorithm_catalog\/([^/]+)\/([^/]+)\/records\/\2\.json$/;

export function findUdpRecords(paths: string[]) {
  const all = new Set(paths);
  return paths.flatMap((path) => {
    const match = path.match(RECORD_PATH);
    if (!match) return [];
    const [, provider, algo] = match;
    const folder = `algorithm_catalog/${provider}/${algo}`;
    if (all.has(`${folder}/openeo_studio/project.json`)) return [];
    const thumbnailPath = `${folder}/records/thumbnail.png`;
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

export function createApexUdpSource(config: ApexConfig): CatalogueSource {
  const raw = apexRawUrl(config);
  return createTreeSource(config, {
    id: 'apex-udp',
    label: 'APEx UDPs',
    find: findUdpRecords,
    emptyMessage: 'No APEx record could be loaded',
    toEntry(item, record) {
      // Records of other kinds of algorithm (CWL, notebooks) are not entries.
      if (!udpHref(record)) return undefined;
      const { description } = record.properties ?? {};
      const ref = `${item.provider}/${item.algo}`;
      return {
        id: ref,
        name: titleOf(record) ?? item.algo,
        description: typeof description === 'string' ? description : '',
        // No collection: the list keeps entries the backend doesn't match.
        thumbnail: item.thumbnailPath && `${raw}/${item.thumbnailPath}`,
        tags: [item.provider],
        open: { loader: 'apex-udp', ref }
      };
    }
  });
}
