import trueColorAlgorithm from '../algorithms/visualizations/true-color.py?raw';
import apaAlgorithm from '../algorithms/visualizations/apa.py?raw';

import type { SampleScene } from '$types';

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
    defaultBands: ['b02', 'b03', 'b04'], // Blue, Green, Red for true color
    temporalRange: ['2025-05-12', '2025-05-13'],
    parameterDefaults: {
      boundingBox: [12.0, 44.5, 14.0, 46.0], // west, south, east, north for Venice area
      cloudCover: 20 // Max cloud cover percentage
    }
  },
  {
    id: 'sentinel-2-apa',
    name: 'Monitoring Aquatic Plants and Algae with Sentinel-2 L2A',
    description:
      'Sentinel-2 derived data for monitoring aquatic plants and algae in Venice.',
    //TODO: thumbnail
    stacUrl:
      'https://api.explorer.eopf.copernicus.eu/stac/collections/sentinel-2-l2a/items/S2B_MSIL2A_20251123T101239_N0511_R022_T32TQR_20251123T105704',
    collectionId: 'sentinel-2-l2a',
    suggestedAlgorithm: apaAlgorithm,
    defaultBands: ['b02', 'b03', 'b04', 'b05', 'b08', 'b8a', 'b11'], // Bands useful for APA
    temporalRange: ['2025-05-12', '2025-05-13'],
    parameterDefaults: {
      boundingBox: [12.0, 44.5, 14.0, 46.0], // west, south, east, north for Venice area
      cloudCover: 30 // Max cloud cover percentage
    }
  }
];

export function getSceneById(id: string): SampleScene | undefined {
  return SAMPLE_SCENES.find((scene) => scene.id === id);
}
