import trueColorAlgorithm from '../algorithms/visualizations/true-color.py?raw';
import swirAlgorithm from '../algorithms/visualizations/swir.py?raw';
import ndciAlgorithm from '../algorithms/visualizations/ndci.py?raw';
import lavaAlgorithm from '../algorithms/visualizations/lava.py?raw';
import bais2Algorithm from '../algorithms/visualizations/bais2.py?raw';
import cloudDetectionAlgorithm from '../algorithms/visualizations/cloud-detection.py?raw';

import type { SampleScene } from '$types';

export const SAMPLE_SCENES: SampleScene[] = [
  {
    id: 'sentinel-2-rgb',
    name: 'Sunny day with Sentinel-2 L2A',
    description: 'Sentinel-2 coverage with nice cloud-free scenes',
    collectionId: 'sentinel-2-l2a',
    suggestedAlgorithm: trueColorAlgorithm,
    defaultBands: ['reflectance|b04', 'reflectance|b03', 'reflectance|b02'], // Red, Green, Blue for true color
    temporalRange: ['2025-11-01', '2026-02-28'],
    boundingBox: [14.11, 40.75, 14.34, 40.85], // west, south, east, north for Naples area
    cloudCover: 20, // Max cloud cover percentage
    thumbnail: './media/scenes/sentinel-2-sunny-naples.png' // Local thumbnail image for the scene
  },
  {
    id: 'sentinel-2-cumbre-vieja',
    name: 'Short-Wave Infra-Red (SWIR) lava visualization',
    description:
      'Sentinel-2 SWIR band combination make the hot lava of the Cumbre Vieja eruption in fall 2021 visible.',
    collectionId: 'sentinel-2-l2a',
    suggestedAlgorithm: swirAlgorithm,
    defaultBands: ['reflectance|b04', 'reflectance|b11', 'reflectance|b12'], // Bands useful for SWIR visualization
    temporalRange: ['2021-09-15', '2021-10-31'],
    boundingBox: [-17.9614, 28.5395, -17.8219, 28.6611], // west, south, east, north for Cumbre Vieja area
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
  },
  {
    id: 'sentinel-2-lava',
    name: 'Lava Flow Visualization with Sentinel-2 L2A',
    description:
      'Sentinel-2 SWIR-based lava flow mapping during the 2021 Cumbre Vieja eruption on La Palma, Canary Islands, Spain (GDACS VO-1000031).',
    collectionId: 'sentinel-2-l2a',
    suggestedAlgorithm: lavaAlgorithm,
    defaultBands: [
      'reflectance|b02',
      'reflectance|b03',
      'reflectance|b04',
      'reflectance|b08',
      'reflectance|b11',
      'reflectance|b12'
    ], // Blue, Green, Red, NIR, SWIR-1, SWIR-2 for lava visualization
    temporalRange: ['2021-10-10', '2021-10-11'],
    boundingBox: [-17.94, 28.58, -17.86, 28.64], // west, south, east, north for Cumbre Vieja, La Palma
    cloudCover: 20, // Max cloud cover percentage
    thumbnail: './media/scenes/lava.png'
  },
  {
    id: 'sentinel-2-bais2',
    name: 'Burned Area Detection with Sentinel-2 L2A',
    description:
      'Sentinel-2 burned area mapping using BAIS2 over the 2025 Portugal wildfires in the Beiras e Serra da Estrela region.',
    collectionId: 'sentinel-2-l2a',
    suggestedAlgorithm: bais2Algorithm,
    defaultBands: [
      'reflectance|b04',
      'reflectance|b06',
      'reflectance|b07',
      'reflectance|b8a',
      'reflectance|b12'
    ], // Red, Red Edge, Red Edge, Narrow NIR, SWIR for BAIS2
    temporalRange: ['2025-08-10', '2025-08-17'],
    boundingBox: [-7.8, 40.1, -7.0, 40.9], // west, south, east, north for Beiras e Serra da Estrela, Portugal
    cloudCover: 20, // Max cloud cover percentage
    thumbnail: './media/scenes/bais2.png'
  },
  {
    id: 'sentinel-2-cloud-detection',
    name: 'Cloud Detection with Sentinel-2 L2A',
    description:
      'Braaten-Cohen-Yang cloud detector highlighting thick and thin clouds using SWIR and green band thresholds over London, UK.',
    collectionId: 'sentinel-2-l2a',
    suggestedAlgorithm: cloudDetectionAlgorithm,
    defaultBands: [
      'reflectance|b02',
      'reflectance|b03',
      'reflectance|b04',
      'reflectance|b11'
    ],
    temporalRange: ['2026-02-16', '2026-02-21'],
    boundingBox: [-0.5, 51.27, 0.34, 51.7], // London, UK
    cloudCover: 100, // We want clouds for this scene
    thumbnail: './media/scenes/cloud_detection_cby.png'
  }
];

export function getSceneById(id: string): SampleScene | undefined {
  return SAMPLE_SCENES.find((scene) => scene.id === id);
}
