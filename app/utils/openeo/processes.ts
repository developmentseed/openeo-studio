/**
 * The processes of the connected openEO backend.
 */
import { appConfig } from '$config/runtime';
import { fetchJson } from '$utils/api';

let request: Promise<Set<string>> | undefined;

/**
 * The ids of the processes the backend offers. Asked once; a failed request
 * is tried again on the next call.
 */
export function fetchProcessIds(authToken?: string): Promise<Set<string>> {
  request ??= fetchJson<{ processes?: { id: string }[] }>(
    `${appConfig.openeoApiUrl}/processes`,
    authToken
  )
    .then((body) => new Set((body?.processes ?? []).map(({ id }) => id)))
    .catch((error) => {
      request = undefined;
      throw error;
    });
  return request;
}
