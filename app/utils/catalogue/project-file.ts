/**
 * Reads the fields shared by every project document: a `project.json` file
 * and the JSON in a `?prefill=` link.
 */
import type { EditorSeed } from '$types';
import { fetchPublic } from '$utils/api';
import { NotFound } from '$utils/errors';
import {
  isPropertyFilter,
  resolvePropertyFilters
} from '$utils/property-filters';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const isString = (v: unknown): v is string => typeof v === 'string';
const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every(isString);

function isBoundingBox(v: unknown): v is EditorSeed['boundingBox'] {
  if (!Array.isArray(v) || v.length !== 4 || !v.every(Number.isFinite)) {
    return false;
  }
  const [west, south, east, north] = v;
  return (
    [west, east].every((lon) => Math.abs(lon) <= 180) &&
    [south, north].every((lat) => Math.abs(lat) <= 90) &&
    south <= north
  );
}

const REQUIRED: Record<string, (v: unknown) => boolean> = {
  name: isString,
  collectionId: isString,
  temporalRange: (v) =>
    isStringArray(v) && v.length === 2 && v.every((d) => DATE_PATTERN.test(d)),
  bands: isStringArray
};

/**
 * Builds a seed, without its code, from an untrusted project document.
 * A missing or malformed required field, or neither an inline `code` nor an
 * `algorithm` path, makes the document unusable and throws `NotFound`. A
 * malformed optional value is left out and named in `incompatibilities`.
 *
 * @param json The parsed document
 * @param label What the document is, for error messages
 */
export function parseProjectFile(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json: any,
  label: string
): { seed: EditorSeed; incompatibilities: string[] } {
  for (const [field, valid] of Object.entries(REQUIRED)) {
    if (!valid(json?.[field])) {
      throw new NotFound(`Invalid ${label}: missing \`${field}\``);
    }
  }
  if (!isString(json.code) && !isString(json.algorithm)) {
    throw new NotFound(`Invalid ${label}: missing \`code\` or \`algorithm\``);
  }

  const invalidFilters = [json.propertyFilters ?? []]
    .flat()
    .filter((filter) => !isPropertyFilter(filter));
  const hasBoundingBox = isBoundingBox(json.boundingBox);
  const incompatibilities = invalidFilters.map(
    (filter) => `Property filter ${JSON.stringify(filter)} is not valid.`
  );
  if (json.boundingBox != null && !hasBoundingBox) {
    incompatibilities.push(
      `Bounding box ${JSON.stringify(json.boundingBox)} is not valid.`
    );
  }

  return {
    seed: {
      name: json.name,
      collectionId: json.collectionId,
      temporalRange: json.temporalRange,
      propertyFilters: resolvePropertyFilters(json),
      bands: json.bands,
      boundingBox: hasBoundingBox ? json.boundingBox : undefined
    },
    incompatibilities
  };
}

/**
 * The code of a project document checked by `parseProjectFile`: its inline
 * `code`, or the file at its `algorithm` path, relative to the document.
 *
 * @param json The parsed document
 * @param url Where the document is, to resolve `algorithm` against
 */
export async function getCode(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json: any,
  url: string,
  signal?: AbortSignal
): Promise<string> {
  if (isString(json.code)) return json.code;
  const codeUrl = new URL(json.algorithm, url).href;
  return (await fetchPublic(codeUrl, signal)).text();
}
