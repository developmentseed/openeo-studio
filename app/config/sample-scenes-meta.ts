/**
 * The data of the sample scenes, without code or images.
 *
 * This file has no imports, so that the build (`vite/plugins/agent-docs.ts`)
 * can read it in Node and write the agent documents from the same source as
 * the app. `sample-scenes.ts` adds the Python code and the thumbnails.
 */

export interface SampleSceneMeta {
  id: string;
  name: string;
  description: string;
  collectionId: string;
  temporalRange: [string, string];
  /** west, south, east, north */
  boundingBox?: [number, number, number, number];
  cloudCover?: number;
  /** Order matters: the script reads `data[i]` in this order. */
  defaultBands: string[];
  /** Path of the Python script, relative to `app/algorithms/`. */
  algorithm: string;
}

export const SAMPLE_SCENES_META: SampleSceneMeta[] = [
  {
    id: 'sentinel-2-rgb',
    name: 'Sunny day with Sentinel-2 L2A',
    description: 'Sentinel-2 coverage with nice cloud-free scenes',
    collectionId: 'sentinel-2-l2a',
    algorithm: 'visualizations/true-color.py',
    defaultBands: [
      'reflectance|bands=b04',
      'reflectance|bands=b03',
      'reflectance|bands=b02'
    ], // Red, Green, Blue for true color
    temporalRange: ['2025-11-01', '2026-02-28'],
    boundingBox: [14.11, 40.75, 14.34, 40.85], // west, south, east, north for Naples area
    cloudCover: 20 // Max cloud cover percentage
  },
  {
    id: 'sentinel-2-apa',
    name: 'Monitoring Aquatic Plants and Algae with Sentinel-2 L2A',
    description:
      'Sentinel-2 derived data for monitoring aquatic plants and algae in Venice.',
    collectionId: 'sentinel-2-l2a',
    algorithm: 'visualizations/apa.py',
    defaultBands: [
      'reflectance|bands=b02',
      'reflectance|bands=b03',
      'reflectance|bands=b04',
      'reflectance|bands=b05',
      'reflectance|bands=b08',
      'reflectance|bands=b8a',
      'reflectance|bands=b11'
    ], // Bands useful for APA
    temporalRange: ['2025-05-12', '2025-05-13'],
    boundingBox: [12.0, 44.5, 14.0, 46.0], // west, south, east, north for Venice area
    cloudCover: 20 // Max cloud cover percentage
  },
  {
    id: 'sentinel-2-ndci',
    name: 'Cyanobacteria Detection with Sentinel-2 L2A',
    description:
      'Sentinel-2 workflow for detecting cyanobacteria in water bodies using the NDCI algorithm.',
    collectionId: 'sentinel-2-l2a',
    algorithm: 'visualizations/ndci.py',
    defaultBands: [
      'reflectance|bands=b02',
      'reflectance|bands=b03',
      'reflectance|bands=b04',
      'reflectance|bands=b05',
      'reflectance|bands=b08',
      'reflectance|bands=b8a',
      'reflectance|bands=b11',
      'reflectance|bands=b12'
    ], // Bands useful for NDCI
    temporalRange: ['2025-05-12', '2025-05-13'],
    boundingBox: [12.0, 44.5, 14.0, 46.0], // west, south, east, north for Venice area
    cloudCover: 20 // Max cloud cover percentage
  },
  {
    id: 'sentinel-2-lava',
    name: 'Lava Flow Visualization with Sentinel-2 L2A',
    description:
      'Sentinel-2 SWIR-based lava flow mapping during the 2021 Cumbre Vieja eruption on La Palma, Canary Islands, Spain (GDACS VO-1000031).',
    collectionId: 'sentinel-2-l2a',
    algorithm: 'visualizations/lava.py',
    defaultBands: [
      'reflectance|bands=b02',
      'reflectance|bands=b03',
      'reflectance|bands=b04',
      'reflectance|bands=b08',
      'reflectance|bands=b11',
      'reflectance|bands=b12'
    ], // Blue, Green, Red, NIR, SWIR-1, SWIR-2 for lava visualization
    temporalRange: ['2021-10-10', '2021-10-11'],
    boundingBox: [-17.94, 28.58, -17.86, 28.64], // west, south, east, north for Cumbre Vieja, La Palma
    cloudCover: 20 // Max cloud cover percentage
  },
  {
    id: 'sentinel-2-bais2',
    name: 'Burned Area Detection with Sentinel-2 L2A',
    description:
      'Sentinel-2 burned area mapping using BAIS2 over the 2025 Portugal wildfires in the Beiras e Serra da Estrela region.',
    collectionId: 'sentinel-2-l2a',
    algorithm: 'visualizations/bais2.py',
    defaultBands: [
      'reflectance|bands=b04',
      'reflectance|bands=b06',
      'reflectance|bands=b07',
      'reflectance|bands=b8a',
      'reflectance|bands=b12'
    ], // Red, Red Edge, Red Edge, Narrow NIR, SWIR for BAIS2
    temporalRange: ['2025-09-25', '2025-09-26'], // Post-fire pass, 0% cloud; the Aug 2025 fire dates have no EOPF data
    boundingBox: [-7.8, 40.1, -7.0, 40.9], // west, south, east, north for Beiras e Serra da Estrela, Portugal
    cloudCover: 20 // Max cloud cover percentage
  },
  {
    id: 'sentinel-2-cloud-detection',
    name: 'Cloud Detection with Sentinel-2 L2A',
    description:
      'Braaten-Cohen-Yang cloud detector highlighting thick and thin clouds using SWIR and green band thresholds over London, UK.',
    collectionId: 'sentinel-2-l2a',
    algorithm: 'visualizations/cloud-detection.py',
    defaultBands: [
      'reflectance|bands=b02',
      'reflectance|bands=b03',
      'reflectance|bands=b04',
      'reflectance|bands=b11'
    ],
    temporalRange: ['2026-02-16', '2026-02-21'],
    boundingBox: [-0.5, 51.27, 0.34, 51.7], // London, UK
    cloudCover: 100 // We want clouds for this scene
  }
];
