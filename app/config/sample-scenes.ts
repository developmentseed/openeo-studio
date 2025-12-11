import trueColorAlgorithm from '../algorithms/visualizations/true-color.py?raw';

export interface SampleScene {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  stacUrl: string;
  suggestedAlgorithm: string;
}

export const SAMPLE_SCENES: SampleScene[] = [
  {
    id: 'sentinel-2-adriatic',
    name: 'Sentinel-2 L2A - Adriatic Sea',
    description: 'Sentinel-2 Level 2A imagery over the Adriatic Sea',
    stacUrl:
      'https://api.explorer.eopf.copernicus.eu/stac/collections/sentinel-2-l2a/items/S2B_MSIL2A_20251123T101239_N0511_R022_T32TQR_20251123T105704',
    suggestedAlgorithm: trueColorAlgorithm
  }
];

export function getSceneById(id: string): SampleScene | undefined {
  return SAMPLE_SCENES.find((scene) => scene.id === id);
}
