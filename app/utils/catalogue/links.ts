/**
 * Query params that open a catalogue entry from a URL, such as an APEx
 * record link or a card opened in a new tab. Each names the loader it uses.
 */
import type { LoadRef } from './types';

const LINK_PARAMS: Record<string, string> = {
  project_url: 'project-url',
  sample_id: 'samples',
  prefill: 'encoded-url',
  apex_udp: 'apex-udp'
};

/**
 * The editor URL that opens this entry, or undefined when its loader has no
 * query param (saved projects open at /editor/<id> instead).
 */
export function entryHref(open: LoadRef): string | undefined {
  const param = Object.keys(LINK_PARAMS).find(
    (name) => LINK_PARAMS[name] === open.loader
  );
  if (!param) return undefined;
  return `/editor?${new URLSearchParams({ [param]: open.ref })}`;
}

/**
 * The entry a URL asks to open, or null when it has no link param.
 */
export function linkFromParams(params: URLSearchParams): LoadRef | null {
  for (const [param, loader] of Object.entries(LINK_PARAMS)) {
    const ref = params.get(param);
    if (ref) return { loader, ref };
  }
  return null;
}
