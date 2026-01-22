import trueColorAlgorithm from '../algorithms/visualizations/true-color.py?raw';
import apaAlgorithm from '../algorithms/visualizations/apa.py?raw';

import type { SampleScene } from '$types';

export const SAMPLE_SCENES: SampleScene[] = [
  {
    id: 'sentinel-2-adriatic',
    name: 'Sunny November day with Sentinel-2 L2A',
    description:
      'Sentinel-2 coverage with nice cloud-free scenes over Italy, for example Venice.',
    collectionId: 'sentinel-2-l2a',
    suggestedAlgorithm: trueColorAlgorithm,
    defaultBands: ['reflectance|b02', 'reflectance|b03', 'reflectance|b04'], // Blue, Green, Red for true color
    temporalRange: ['2025-05-12', '2025-05-13'],
    boundingBox: [12.0, 44.5, 14.0, 46.0], // west, south, east, north for Venice area
    cloudCover: 20 // Max cloud cover percentage
  },
  {
    id: 'sentinel-2-apa',
    name: 'Monitoring Aquatic Plants and Algae with Sentinel-2 L2A',
    description:
      'Sentinel-2 derived data for monitoring aquatic plants and algae in Venice.',
    collectionId: 'sentinel-2-l2a',
    suggestedAlgorithm: apaAlgorithm,
    defaultBands: [
      'reflectance|b02',
      'reflectance|b03',
      'reflectance|b04',
      'reflectance|b05',
      'reflectance|b08',
      'reflectance|b8a',
      'reflectance|b11'
    ], // Bands useful for APA
    temporalRange: ['2025-05-12', '2025-05-13'],
    boundingBox: [12.0, 44.5, 14.0, 46.0], // west, south, east, north for Venice area
    cloudCover: 20 // Max cloud cover percentage
  }
];

export function getSceneById(id: string): SampleScene | undefined {
  return SAMPLE_SCENES.find((scene) => scene.id === id);
}
