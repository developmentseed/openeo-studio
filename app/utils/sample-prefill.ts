/**
 * Reads a sample from an external link (`?sample=` or `?sampleUrl=`).
 *
 * The rules here agree with `app/types/sample-prefill.schema.json`, which is
 * generated from `app/types/sample-prefill.ts`.
 */

import type { SamplePrefill } from '$types/sample-prefill';

export const SAMPLE_PARAM = 'sample';
export const SAMPLE_URL_PARAM = 'sampleUrl';

export const MAX_CODE_LENGTH = 100000;

export class SamplePrefillError extends Error {}

/** The same pattern as `SampleDate` in the schema. */
export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Encodes a sample as base64url of its UTF-8 JSON. */
export function encodeSamplePrefill(sample: SamplePrefill): string {
  const bytes = new TextEncoder().encode(JSON.stringify(sample));
  let binary = '';
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/** Decodes base64url (or base64) UTF-8 JSON. */
export function decodeSamplePrefill(encoded: string): unknown {
  const base64 = encoded.trim().replace(/-/g, '+').replace(/_/g, '/');
  let binary: string;
  try {
    binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
  } catch {
    throw new SamplePrefillError('The sample in the link is not base64url.');
  }
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new SamplePrefillError('The sample in the link is not JSON.');
  }
}

/** Returns the sample when it is valid, or throws a SamplePrefillError. */
export function validateSamplePrefill(value: unknown): SamplePrefill {
  const fail = (message: string): never => {
    throw new SamplePrefillError(`The sample is not valid: ${message}`);
  };

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    fail('it must be a JSON object.');
  }
  const sample = value as Record<string, unknown>;

  if (typeof sample.code !== 'string' || !sample.code.trim()) {
    fail('"code" must be a string that is not empty.');
  }
  if ((sample.code as string).length > MAX_CODE_LENGTH) {
    fail(`"code" must be at most ${MAX_CODE_LENGTH} characters.`);
  }
  if (typeof sample.collectionId !== 'string' || !sample.collectionId) {
    fail('"collectionId" must be a string that is not empty.');
  }
  const range = sample.temporalRange;
  if (
    !Array.isArray(range) ||
    range.length !== 2 ||
    !range.every((date) => typeof date === 'string' && DATE_PATTERN.test(date))
  ) {
    fail('"temporalRange" must be two dates, YYYY-MM-DD.');
  }
  const bands = sample.bands;
  if (
    !Array.isArray(bands) ||
    bands.length === 0 ||
    !bands.every((band) => typeof band === 'string' && band)
  ) {
    fail('"bands" must be a list of band ids that is not empty.');
  }
  const bbox = sample.boundingBox;
  if (bbox !== undefined) {
    if (
      !Array.isArray(bbox) ||
      bbox.length !== 4 ||
      !bbox.every((n) => typeof n === 'number' && Number.isFinite(n))
    ) {
      fail('"boundingBox" must be four numbers: west, south, east, north.');
    }
    const [west, south, east, north] = bbox as number[];
    if ([west, east].some((lon) => lon < -180 || lon > 180)) {
      fail('"boundingBox" longitudes must be from -180 to 180.');
    }
    if ([south, north].some((lat) => lat < -90 || lat > 90)) {
      fail('"boundingBox" latitudes must be from -90 to 90.');
    }
    if (south > north) {
      fail('"boundingBox" south must not be more than north.');
    }
  }
  const cloudCover = sample.cloudCover;
  if (
    cloudCover !== undefined &&
    (typeof cloudCover !== 'number' || cloudCover < 0 || cloudCover > 100)
  ) {
    fail('"cloudCover" must be a number from 0 to 100.');
  }
  if (sample.name !== undefined && typeof sample.name !== 'string') {
    fail('"name" must be a string.');
  }

  return {
    name: sample.name as string | undefined,
    code: sample.code as string,
    collectionId: sample.collectionId as string,
    temporalRange: range as [string, string],
    bands: bands as string[],
    boundingBox: bbox as SamplePrefill['boundingBox'],
    cloudCover: cloudCover as number | undefined
  };
}

/** Fetches a sample from an https URL, without credentials. */
export async function fetchSamplePrefill(
  url: string,
  fetchFn?: typeof fetch
): Promise<unknown> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new SamplePrefillError('The sample URL is not a URL.');
  }
  const isLocal = ['localhost', '127.0.0.1'].includes(parsed.hostname);
  if (parsed.protocol !== 'https:' && !isLocal) {
    throw new SamplePrefillError('The sample URL must use https.');
  }

  let response: Response;
  try {
    response = await (fetchFn ?? fetch)(parsed.href, {
      credentials: 'omit'
    });
  } catch {
    throw new SamplePrefillError(
      'Cannot get the sample. The host must allow CORS.'
    );
  }
  if (!response.ok) {
    throw new SamplePrefillError(
      `Cannot get the sample (HTTP ${response.status}).`
    );
  }
  try {
    return await response.json();
  } catch {
    throw new SamplePrefillError('The sample at the URL is not JSON.');
  }
}

/**
 * Reads the sample from the query of a link. Returns null when the query
 * has no sample.
 */
export async function readSamplePrefill(
  params: URLSearchParams,
  fetchFn?: typeof fetch
): Promise<SamplePrefill | null> {
  const encoded = params.get(SAMPLE_PARAM);
  if (encoded) return validateSamplePrefill(decodeSamplePrefill(encoded));

  const url = params.get(SAMPLE_URL_PARAM);
  if (url) return validateSamplePrefill(await fetchSamplePrefill(url, fetchFn));

  return null;
}
