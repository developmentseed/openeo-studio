/**
 * OIDC configuration from the openEO backend (`GET /credentials/oidc`).
 *
 * The backend is the source of truth for the authority, the scopes and the
 * public client. The AUTH_* runtime values are optional overrides: when one is
 * set, it wins over the value from the backend.
 *
 * This module has no dependency on `$config/runtime` so that it can be unit
 * tested. The caller gives the overrides and the page location.
 */

/** The grant type that a browser app uses (same rule as openeo-js-client). */
export const PKCE_GRANT_TYPE = 'authorization_code+pkce';

/** The provider id that studio used before it read the backend config. */
export const DEFAULT_PROVIDER_ID = 'oidc';

const DEFAULT_SCOPE = 'openid';
const FETCH_TIMEOUT_MS = 10_000;
const CACHE_KEY_PREFIX = 'openeo-studio:credentials-oidc:';

export interface OidcDefaultClient {
  id: string;
  grant_types: string[];
  redirect_urls?: string[];
}

export interface OidcProvider {
  id: string;
  issuer: string;
  title?: string;
  description?: string;
  scopes?: string[];
  default_clients?: OidcDefaultClient[];
}

export interface OidcProvidersResponse {
  providers: OidcProvider[];
}

export interface OidcOverrides {
  authority?: string;
  clientId?: string;
  redirectUri?: string;
}

export interface OidcLocation {
  /** For example `https://studio.example.com`. */
  origin: string;
  /** Leading slash, no trailing slash, empty at the root. */
  pathPrefix: string;
}

/** Result of `GET /credentials/oidc`. */
export type OidcProvidersResult =
  | { status: 'ok'; data: OidcProvidersResponse }
  /** The backend does not support OIDC (404, or no providers). */
  | { status: 'none' }
  /** The backend cannot be reached, or the response is not valid. */
  | { status: 'error'; message: string };

export interface OidcSettings {
  authority: string;
  client_id: string;
  redirect_uri: string;
  scope: string;
}

export type OidcErrorReason = 'unreachable' | 'no-client' | 'incomplete';

export type OidcResolution =
  | { status: 'ok'; settings: OidcSettings; providerId: string }
  /** No OIDC on the backend and no overrides: the app runs without login. */
  | { status: 'disabled' }
  | {
      status: 'error';
      reason: OidcErrorReason;
      message: string;
      details?: string[];
    };

function stripTrailingSlashes(url: string): string {
  return url.replace(/\/+$/, '');
}

/** The URL of the app root, for example `https://host/studio/`. */
export function appBaseUrl(location: OidcLocation): string {
  return `${location.origin}${location.pathPrefix}/`;
}

/**
 * Finds the redirect URL of `client` that is applicable to this app.
 *
 * 1. A redirect URL that is the app root (trailing slash is ignored).
 * 2. Else, a redirect URL in the app (same origin and path prefix).
 */
export function matchRedirectUrl(
  client: OidcDefaultClient,
  location: OidcLocation
): string | undefined {
  const urls = Array.isArray(client.redirect_urls) ? client.redirect_urls : [];
  const base = stripTrailingSlashes(appBaseUrl(location));

  const exact = urls.find((url) => stripTrailingSlashes(url) === base);
  if (exact) return exact;

  return urls.find((url) => url.startsWith(`${base}/`));
}

/**
 * Finds the default client to use for this app: a client that has the
 * `authorization_code+pkce` grant type and a redirect URL in this app.
 */
export function selectDefaultClient(
  provider: OidcProvider,
  location: OidcLocation
): { client: OidcDefaultClient; redirectUrl: string } | undefined {
  for (const client of provider.default_clients ?? []) {
    if (!client.grant_types?.includes(PKCE_GRANT_TYPE)) continue;
    const redirectUrl = matchRedirectUrl(client, location);
    if (redirectUrl) return { client, redirectUrl };
  }
  return undefined;
}

/** Joins the provider scopes. Adds `openid` when it is not there. */
export function toScope(scopes: string[] | undefined): string {
  const list = (scopes ?? []).filter(Boolean);
  if (!list.length) return DEFAULT_SCOPE;
  if (!list.includes('openid')) list.unshift('openid');
  return list.join(' ');
}

function sameIssuer(a: string, b: string): boolean {
  return stripTrailingSlashes(a) === stripTrailingSlashes(b);
}

/**
 * Makes the OIDC settings from the backend response and the overrides.
 */
export function resolveOidcSettings(
  result: OidcProvidersResult,
  overrides: OidcOverrides,
  location: OidcLocation
): OidcResolution {
  const { authority, clientId, redirectUri } = overrides;
  const hasOverrides = Boolean(authority || clientId || redirectUri);

  // Without a provider from the backend, only a full override can work.
  if (result.status !== 'ok') {
    if (authority && clientId) {
      return {
        status: 'ok',
        providerId: DEFAULT_PROVIDER_ID,
        settings: {
          authority,
          client_id: clientId,
          redirect_uri: redirectUri || appBaseUrl(location),
          scope: DEFAULT_SCOPE
        }
      };
    }

    if (result.status === 'error') {
      return {
        status: 'error',
        reason: 'unreachable',
        message: 'Cannot get the login configuration from the openEO backend.',
        details: [result.message]
      };
    }

    if (!hasOverrides) return { status: 'disabled' };

    return {
      status: 'error',
      reason: 'incomplete',
      message:
        'The openEO backend does not support OpenID Connect. Set AUTH_AUTHORITY and AUTH_CLIENT_ID to use a different provider.'
    };
  }

  const { providers } = result.data;

  // With an authority override, prefer the provider that has the same
  // issuer. Then use the first provider that has a client for this app. The
  // openEO API gives the default provider first.
  const byIssuer = authority
    ? providers.filter((p) => sameIssuer(p.issuer, authority))
    : [];
  const candidates = byIssuer.length ? byIssuer : providers;

  let provider: OidcProvider | undefined;
  let match: ReturnType<typeof selectDefaultClient>;
  for (const p of candidates) {
    match = selectDefaultClient(p, location);
    if (match) {
      provider = p;
      break;
    }
  }
  provider = provider ?? candidates[0];

  if (!match && !clientId) {
    const redirectUrls = providers.flatMap((p) =>
      (p.default_clients ?? [])
        .filter((c) => c.grant_types?.includes(PKCE_GRANT_TYPE))
        .flatMap((c) => c.redirect_urls ?? [])
    );
    return {
      status: 'error',
      reason: 'no-client',
      message: `The openEO backend has no login client for ${appBaseUrl(location)}.`,
      details: [
        `Redirect URLs that the backend accepts: ${
          redirectUrls.length ? redirectUrls.join(', ') : 'none'
        }.`,
        'Add this URL to the backend redirect URLs, or set AUTH_CLIENT_ID.'
      ]
    };
  }

  const resolvedAuthority = authority || provider?.issuer;
  if (!resolvedAuthority) {
    return {
      status: 'error',
      reason: 'incomplete',
      message: 'The openEO backend gives no OpenID Connect issuer.'
    };
  }

  return {
    status: 'ok',
    providerId: provider?.id || DEFAULT_PROVIDER_ID,
    settings: {
      authority: resolvedAuthority,
      client_id: clientId || match!.client.id,
      redirect_uri: redirectUri || match?.redirectUrl || appBaseUrl(location),
      scope: toScope(provider?.scopes)
    }
  };
}

function isProvidersResponse(value: unknown): value is OidcProvidersResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as OidcProvidersResponse).providers)
  );
}

function cacheKey(apiUrl: string): string {
  return `${CACHE_KEY_PREFIX}${stripTrailingSlashes(apiUrl)}`;
}

function readCache(apiUrl: string): OidcProvidersResponse | undefined {
  try {
    const raw = window.sessionStorage.getItem(cacheKey(apiUrl));
    if (!raw) return undefined;
    const value = JSON.parse(raw);
    return isProvidersResponse(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

export function clearOidcProvidersCache(apiUrl: string) {
  try {
    window.sessionStorage.removeItem(cacheKey(apiUrl));
  } catch {
    // Storage is not available. There is no cache to clear.
  }
}

function writeCache(apiUrl: string, data: OidcProvidersResponse) {
  try {
    window.sessionStorage.setItem(cacheKey(apiUrl), JSON.stringify(data));
  } catch {
    // Storage is not available. The next page load fetches again.
  }
}

/**
 * Gets `GET {apiUrl}/credentials/oidc`. A valid response is kept in
 * sessionStorage, so that the page load after the OIDC redirect does not
 * fetch again.
 */
export async function fetchOidcProviders(
  apiUrl: string,
  fetchFn: typeof fetch = fetch
): Promise<OidcProvidersResult> {
  const cached = readCache(apiUrl);
  if (cached) {
    return cached.providers.length
      ? { status: 'ok', data: cached }
      : { status: 'none' };
  }

  const url = `${stripTrailingSlashes(apiUrl)}/credentials/oidc`;

  let response: Response;
  try {
    response = await fetchFn(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
    });
  } catch (error) {
    return {
      status: 'error',
      message: `${url}: ${error instanceof Error ? error.message : String(error)}`
    };
  }

  // A backend without OIDC (for example, only /credentials/basic).
  if ([404, 405, 501].includes(response.status)) return { status: 'none' };

  if (!response.ok) {
    return {
      status: 'error',
      message: `${url}: HTTP ${response.status} ${response.statusText}`.trim()
    };
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    return { status: 'error', message: `${url}: the response is not JSON.` };
  }

  if (!isProvidersResponse(data)) {
    return {
      status: 'error',
      message: `${url}: the response has no "providers" list.`
    };
  }

  writeCache(apiUrl, data);
  return data.providers.length ? { status: 'ok', data } : { status: 'none' };
}

// The result of the bootstrap. It is set one time, before the first render.
let resolution: OidcResolution = { status: 'disabled' };

export function setOidcResolution(value: OidcResolution) {
  resolution = value;
}

/** The provider id for the openEO bearer token (`oidc/<id>/<token>`). */
export function getOidcProviderId(): string {
  return resolution.status === 'ok'
    ? resolution.providerId
    : DEFAULT_PROVIDER_ID;
}
