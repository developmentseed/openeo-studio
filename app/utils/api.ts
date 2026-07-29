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

export async function fetchJson<T>(
  url: string,
  token?: string,
  options: RequestInit = {}
): Promise<T> {
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

  const data = (await response.json()) as T;
  return data;
}
