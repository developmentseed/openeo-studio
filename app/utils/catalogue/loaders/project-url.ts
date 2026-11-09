/**
 * Loads a studio project file (`project.json` plus the code file it points
 * to) from any URL, without openEO credentials. The code is only loaded,
 * never run.
 */
import { fetchPublic } from '$utils/api';
import { NotFound } from '$utils/errors';
import { parseProjectFile } from '../project-file';
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
    const label = `project file at ${url}`;
    const { seed, incompatibilities } = parseProjectFile(json, label);

    if (typeof json.algorithm !== 'string') {
      throw new NotFound(`Invalid ${label}: missing \`algorithm\``);
    }
    const codeUrl = new URL(json.algorithm, url).href;
    const code = await (await fetchPublic(codeUrl, signal)).text();

    return {
      seed: { ...seed, suggestedAlgorithm: code },
      autoRun: false,
      incompatibilities
    };
  }
};
