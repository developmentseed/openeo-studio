import trueColorAlgorithm from '../algorithms/visualizations/true-color.py?raw';
import swirAlgorithm from '../algorithms/visualizations/swir.py?raw';
import ndciAlgorithm from '../algorithms/visualizations/ndci.py?raw';

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
    id: 'sentinel-2-cumbre-vieja',
    name: 'Short-Wave Infra-Red (SWIR) lava visualisation',
    description:
      'Sentinel-2 SWIR band combination make the hot lava of the Cumbre Vieja eruption in fall 2021 visible.',
    collectionId: 'sentinel-2-l2a',
    suggestedAlgorithm: swirAlgorithm,
    defaultBands: ['reflectance|b04', 'reflectance|b11', 'reflectance|b12'], // Bands useful for SWIR visualisation
    temporalRange: ['2021-09-15', '2021-10-31'],
    boundingBox: [-17.9614, 28.5395, -17.8219, 28.6611], // west, south, east, north for Venice area
    cloudCover: 40 // Max cloud cover percentage
  },
  {
    id: 'sentinel-2-ndci',
    name: 'Cyanobacteria Detection with Sentinel-2 L2A',
    description:
      'Sentinel-2 workflow for detecting cyanobacteria in water bodies using the NDCI algorithm.',
    collectionId: 'sentinel-2-l2a',
    suggestedAlgorithm: ndciAlgorithm,
    defaultBands: [
      'reflectance|b02',
      'reflectance|b03',
      'reflectance|b04',
      'reflectance|b05',
      'reflectance|b08',
      'reflectance|b8a',
      'reflectance|b11',
      'reflectance|b12'
    ], // Bands useful for NDCI
    temporalRange: ['2025-05-12', '2025-05-13'],
    boundingBox: [12.0, 44.5, 14.0, 46.0], // west, south, east, north for Venice area
    cloudCover: 20, // Max cloud cover percentage
    thumbnail:
      'https://github.com/EOPF-Explorer/eodash-assets/blob/main/narratives/NDCI/hero.png?raw=true'
  }
];

export function getSceneById(id: string): SampleScene | undefined {
  return SAMPLE_SCENES.find((scene) => scene.id === id);
}
