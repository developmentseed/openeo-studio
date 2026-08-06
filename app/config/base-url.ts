/**
 * Parses VITE_BASE_URL / BASE_URL — the single source of truth for where
 * the app is mounted — into a URL, or undefined if it isn't a real,
 * parseable absolute URL yet. During Docker's image build, VITE_BASE_URL is
 * deliberately left as the literal escaped string `${BASE_URL}` (see
 * docker/vite-placeholders.env) to be resolved by envsubst at container
 * start; callers must treat that case the same as "not set yet".
 */
export function parseBaseUrl(rawUrl: string | undefined): URL | undefined {
  if (!rawUrl) return undefined;
  try {
    return new URL(rawUrl);
  } catch {
    return undefined;
  }
}

/** The URL's path only, no trailing slash; '' if there is no path or no valid URL. */
export function pathPrefixFromUrl(rawUrl: string | undefined): string {
  return parseBaseUrl(rawUrl)?.pathname.replace(/\/+$/, '') ?? '';
}
