/**
 * Loads a studio project file (`project.json`, with inline `code` or an
 * `algorithm` path to its code file) from any URL, without openEO
 * credentials. The code is only loaded, never run.
 */
import { fetchPublic } from '$utils/api';
import { NotFound } from '$utils/errors';
import { getCode, parseProjectFile } from '../project-file';
import type { ProjectLoader } from '../types';

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
    const { seed, incompatibilities } = parseProjectFile(
      json,
      `project file at ${url}`
    );

    return {
      seed: { ...seed, suggestedAlgorithm: await getCode(json, url, signal) },
      autoRun: false,
      incompatibilities
    };
  }
};
