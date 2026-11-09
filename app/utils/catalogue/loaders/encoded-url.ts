/**
 * Loads a project carried whole in the link, `?prefill=<base64url JSON>`.
 * The JSON has the fields of a project file, with the code inline in `code`.
 * The code is only loaded, never run.
 */
import { NotFound } from '$utils/errors';
import { parseProjectFile } from '../project-file';
import type { ProjectLoader } from '../types';

const LABEL = 'project in the link';

function decode(ref: string) {
  try {
    const base64 = ref.replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new NotFound(`Invalid ${LABEL}: not base64url JSON`);
  }
}

export const encodedUrlLoader: ProjectLoader = {
  id: 'encoded-url',
  async load(ref) {
    const json = decode(ref);
    const { seed, incompatibilities } = parseProjectFile(
      { name: 'Project from a link', ...json },
      LABEL
    );
    if (typeof json.code !== 'string' || !json.code.trim()) {
      throw new NotFound(`Invalid ${LABEL}: missing \`code\``);
    }
    return {
      seed: { ...seed, suggestedAlgorithm: json.code },
      autoRun: false,
      external: true,
      incompatibilities
    };
  }
};
