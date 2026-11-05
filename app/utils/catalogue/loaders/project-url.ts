/**
 * Loads a studio project file (`project.json` plus the code file it points
 * to) from any URL, without openEO credentials. The code is only loaded,
 * never run.
 */
import type { EditorSeed } from '$types';
import { fetchPublic } from '$utils/api';
import { NotFound } from '$utils/errors';
import type { ProjectLoader } from '../types';

const isString = (v: unknown): v is string => typeof v === 'string';
const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every(isString);

const isBoundingBox = (v: unknown): v is EditorSeed['boundingBox'] =>
  Array.isArray(v) && v.length === 4 && v.every((n) => typeof n === 'number');

const REQUIRED: Record<string, (v: unknown) => boolean> = {
  name: isString,
  collectionId: isString,
  temporalRange: (v) => isStringArray(v) && v.length === 2,
  defaultBands: isStringArray,
  algorithm: isString
};

export const projectUrlLoader: ProjectLoader = {
  id: 'project-url',
  async load(url, { signal }) {
    const response = await fetchPublic(url, signal);
    // An unusable file counts as not found, so a link to it shows the 404 page.
    let json;
    try {
      json = await response.json();
    } catch {
      // e.g. an SPA host answering an unknown path with its index.html
      throw new NotFound(`Invalid project file at ${url}: not JSON`);
    }
    for (const [field, valid] of Object.entries(REQUIRED)) {
      if (!valid(json?.[field])) {
        throw new NotFound(
          `Invalid project file at ${url}: missing \`${field}\``
        );
      }
    }

    const codeUrl = new URL(json.algorithm, url).href;
    const code = await (await fetchPublic(codeUrl, signal)).text();

    const seed: EditorSeed = {
      name: json.name,
      collectionId: json.collectionId,
      temporalRange: json.temporalRange,
      cloudCover: typeof json.cloudCover === 'number' ? json.cloudCover : 100,
      defaultBands: json.defaultBands,
      boundingBox: isBoundingBox(json.boundingBox)
        ? json.boundingBox
        : undefined,
      suggestedAlgorithm: code
    };
    return { seed, autoRun: false };
  }
};
