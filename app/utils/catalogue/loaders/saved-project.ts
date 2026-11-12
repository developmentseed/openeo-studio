/**
 * Loads a user's saved project (a UDP on the openEO backend). These open at
 * /editor/<id>, unlike every other entry.
 */
import { DEFAULT_EDITOR_CONFIG } from '$config/default-editor-config';
import { useProjectsStore } from '$stores/projects-store';
import {
  deriveConfigFromProject,
  extractCodeFromDescription
} from '$utils/openeo/user-defined-processes';
import type { EditorSeed, UserDefinedProcess } from '$types';
import type { ProjectLoader } from '../types';

export function projectToSeed(project: UserDefinedProcess): EditorSeed {
  const derived = deriveConfigFromProject(project);
  return {
    name: project.summary ?? project.id,
    collectionId: derived.collectionId ?? DEFAULT_EDITOR_CONFIG.collectionId,
    temporalRange: derived.temporalRange ?? DEFAULT_EDITOR_CONFIG.temporalRange,
    cloudCover: derived.cloudCover ?? DEFAULT_EDITOR_CONFIG.cloudCover,
    bands: derived.selectedBands ?? DEFAULT_EDITOR_CONFIG.selectedBands,
    boundingBox: derived.boundingBox,
    suggestedAlgorithm: extractCodeFromDescription(project.description) ?? ''
  };
}

export const savedProjectLoader: ProjectLoader = {
  id: 'saved-project',
  async load(ref, ctx) {
    const project = await useProjectsStore
      .getState()
      .loadProject(ctx.authToken ?? '', ref);
    return { seed: projectToSeed(project), projectId: ref, autoRun: true };
  }
};
