import trueColorAlgorithm from '../algorithms/visualizations/true-color.py?raw';

export interface SampleScene {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  stacUrl: string;
  collectionId: string;
  suggestedAlgorithm: string;
  /** Default bands for this algorithm (e.g., ['b02', 'b03', 'b04']) */
  defaultBands: string[];
}

export const SAMPLE_SCENES: SampleScene[] = [
  {
    id: 'sentinel-2-adriatic',
    name: 'Sunny November day with Sentinel-2 L2A',
    description:
      'Sentinel-2 coverage with nice cloud-free scenes over Italy, for example Venice.',
    //TODO: thumbnail
    stacUrl:
      'https://api.explorer.eopf.copernicus.eu/stac/collections/sentinel-2-l2a/items/S2B_MSIL2A_20251123T101239_N0511_R022_T32TQR_20251123T105704',
    collectionId: 'sentinel-2-l2a',
    suggestedAlgorithm: trueColorAlgorithm,
    defaultBands: ['b02', 'b03', 'b04'] // Blue, Green, Red for true color
  }
];

export function getSceneById(id: string): SampleScene | undefined {
  return SAMPLE_SCENES.find((scene) => scene.id === id);
}
