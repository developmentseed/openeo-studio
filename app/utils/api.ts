/**
 * Shared fetch-as-JSON helper for openEO API calls.
 */

export class APIError extends Error {
  detail: any = null;
  code: number;
  statusText: string;

  constructor(message: string, code: number, statusText: string, detail?: any) {
    super(message);
    this.name = 'APIError';
    this.detail = detail;
    this.code = code;
    this.statusText = statusText;
  }
}

const AUTH_PREFIX = 'Bearer oidc/oidc/';

/**
 * Performs an authenticated fetch and throws an APIError on a non-2xx
 * response. Returns the raw Response so callers can read the body or headers.
 */
async function request(
  url: string,
  token?: string,
  options: RequestInit = {}
): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(token ? { Authorization: `${AUTH_PREFIX}${token}` } : {}),
      ...options.headers
    }
  });

  if (!response.ok) {
    const { status, statusText } = response;

    const e = new APIError(
      `Error ${status}: ${statusText}`,
      status,
      statusText
    );

    // Some APIs return errors as JSON others as string.
    // Clone the response so we can read the body as text if json fails.
    const clone = response.clone();
    try {
      e.detail = await response.json();
      /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    } catch (err) {
      e.detail = await clone.text();
    }
    throw e;
  }

  return response;
}

export async function fetchJson<T>(
  url: string,
  token?: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await request(url, token, options);

  // Some endpoints (e.g. PUT /process_graphs/{id}) respond 204 No Content.
  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch (_: any) {
    return text as T;
  }
}

/**
 * Performs an authenticated request and returns the `Location` response
 * header. Used by openEO create endpoints (e.g. POST /services) that respond
 * with the new resource URL in the header rather than the body.
 */
export async function fetchHeaderLocation(
  url: string,
  token?: string,
  options: RequestInit = {}
): Promise<string> {
  const response = await request(url, token, options);

  const location = response.headers.get('location');
  if (!location) {
    throw new APIError(
      'No location header in response',
      response.status,
      response.statusText
    );
  }

  return location;
}
