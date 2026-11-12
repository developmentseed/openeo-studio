/**
 * The sample scenes bundled with the app, as a catalogue source and loader.
 */
import { SAMPLE_SCENES } from '$config/sample-scenes';
import { NotFound } from '$utils/errors';
import type { EditorSeed, SampleScene } from '$types';
import { matchesQuery, paginate } from '../paginate';
import type { CatalogueEntry, CatalogueSource, ProjectLoader } from '../types';

export function sampleToEntry(scene: SampleScene): CatalogueEntry {
  return {
    id: scene.id,
    name: scene.name,
    description: scene.description,
    thumbnail: scene.thumbnail,
    collectionId: scene.collectionId,
    bands: scene.bands,
    open: { loader: 'samples', ref: scene.id }
  };
}

export function sampleToSeed(scene: SampleScene): EditorSeed {
  return {
    name: scene.name,
    collectionId: scene.collectionId,
    temporalRange: scene.temporalRange,
    propertyFilters: scene.propertyFilters ?? [],
    bands: scene.bands ?? [],
    boundingBox: scene.boundingBox,
    suggestedAlgorithm: scene.suggestedAlgorithm
  };
}

export const samplesSource: CatalogueSource = {
  id: 'samples',
  label: 'Samples',
  async listEntries(query, _ctx, cursor) {
    const entries = SAMPLE_SCENES.map(sampleToEntry).filter((entry) =>
      matchesQuery(entry, query)
    );
    return paginate(entries, query, cursor);
  }
};

export const samplesLoader: ProjectLoader = {
  id: 'samples',
  async load(ref) {
    const scene = SAMPLE_SCENES.find((s) => s.id === ref);
    if (!scene) throw new NotFound(`Sample not found: ${ref}`);
    return { seed: sampleToSeed(scene), autoRun: true };
  }
};
