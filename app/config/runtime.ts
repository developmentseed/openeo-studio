/**
 * Runtime config: window.__APP_CONFIG__ (Docker) with VITE_* fallbacks (local).
 */

export interface AppConfig {
  openeoApiUrl: string;
  pathPrefix: string;
  appTitle: string;
  appDescription: string;
  maptilerKey: string;
  authAuthority: string;
  authClientId: string;
  authRedirectUri: string;
  enableNarrativeExport: boolean;
}

declare global {
  interface Window {
    __APP_CONFIG__?: Partial<AppConfig>;
  }
}

function pick(
  runtimeValue: string | undefined,
  envValue: string | undefined,
  fallback = ''
): string {
  return runtimeValue || envValue || fallback;
}

/** Leading slash, no trailing slash; empty when served at root. */
function normalizePathPrefix(prefix: string): string {
  if (!prefix || prefix === '/') return '';
  return `/${prefix.replace(/^\/+|\/+$/g, '')}`;
}

const runtime = window.__APP_CONFIG__ ?? {};

export const appConfig: AppConfig = {
  openeoApiUrl: pick(
    runtime.openeoApiUrl,
    import.meta.env.VITE_OPENEO_API_URL,
    'https://api.explorer.eopf.copernicus.eu/openeo'
  ),
  pathPrefix: normalizePathPrefix(
    pick(runtime.pathPrefix, import.meta.env.VITE_PATH_PREFIX)
  ),
  appTitle: pick(runtime.appTitle, import.meta.env.VITE_APP_TITLE),
  appDescription: pick(
    runtime.appDescription,
    import.meta.env.VITE_APP_DESCRIPTION
  ),
  maptilerKey: pick(runtime.maptilerKey, import.meta.env.VITE_MAPTILER_KEY),
  authAuthority: pick(
    runtime.authAuthority,
    import.meta.env.VITE_AUTH_AUTHORITY
  ),
  authClientId: pick(runtime.authClientId, import.meta.env.VITE_AUTH_CLIENT_ID),
  authRedirectUri: pick(
    runtime.authRedirectUri,
    import.meta.env.VITE_AUTH_REDIRECT_URI
  ),
  enableNarrativeExport:
    runtime.enableNarrativeExport ??
    import.meta.env.VITE_ENABLE_NARRATIVE_EXPORT === 'true'
};
