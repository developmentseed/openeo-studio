import trueColorAlgorithm from '../algorithms/visualizations/true-color.py?raw';
import apaAlgorithm from '../algorithms/visualizations/apa.py?raw';
import ndciAlgorithm from '../algorithms/visualizations/ndci.py?raw';
import lavaAlgorithm from '../algorithms/visualizations/lava.py?raw';
import bais2Algorithm from '../algorithms/visualizations/bais2.py?raw';
import cloudDetectionAlgorithm from '../algorithms/visualizations/cloud-detection.py?raw';

import thumbS2RGB from '../media/scenes/sentinel-2-sunny-naples.png';
import thumbS2Lava from '../media/scenes/lava.png';
import thumbS2Bais2 from '../media/scenes/bais2.png';
import thumbS2Cloud from '../media/scenes/cloud_detection_cby.png';

import { SAMPLE_SCENES_META } from './sample-scenes-meta';
import type { SampleScene } from '$types';

/** Python code by `SampleSceneMeta.algorithm` path. */
const ALGORITHMS: Record<string, string> = {
  'visualizations/true-color.py': trueColorAlgorithm,
  'visualizations/apa.py': apaAlgorithm,
  'visualizations/ndci.py': ndciAlgorithm,
  'visualizations/lava.py': lavaAlgorithm,
  'visualizations/bais2.py': bais2Algorithm,
  'visualizations/cloud-detection.py': cloudDetectionAlgorithm
};

const THUMBNAILS: Record<string, string> = {
  'sentinel-2-rgb': thumbS2RGB,
  'sentinel-2-ndci':
    'https://github.com/EOPF-Explorer/eodash-assets/blob/main/narratives/NDCI/hero.png?raw=true',
  'sentinel-2-lava': thumbS2Lava,
  'sentinel-2-bais2': thumbS2Bais2,
  'sentinel-2-cloud-detection': thumbS2Cloud
};

export const SAMPLE_SCENES: SampleScene[] = SAMPLE_SCENES_META.map(
  ({ algorithm, ...meta }) => {
    const suggestedAlgorithm = ALGORITHMS[algorithm];
    if (suggestedAlgorithm === undefined) {
      throw new Error(`Sample ${meta.id}: no code for ${algorithm}`);
    }
    return { ...meta, suggestedAlgorithm, thumbnail: THUMBNAILS[meta.id] };
  }
);

export function getSceneById(id: string): SampleScene | undefined {
  return SAMPLE_SCENES.find((scene) => scene.id === id);
}

export function isSampleScene(sceneId: string | null): boolean {
  return sceneId != null && getSceneById(sceneId) !== undefined;
}

export function shouldNavigateAfterSave(sceneId: string | null): boolean {
  return !sceneId || isSampleScene(sceneId);
}
