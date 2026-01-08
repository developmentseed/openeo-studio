/**
 * STAC Band Parsing Utilities
 *
 * Extract band metadata from STAC items and collections for display in the editor.
 * Supports Sentinel-2 L2A reflectance band structure and OpenEO collection formats.
 */
import type { StacItem, StacCollection } from 'stac-ts';

import type { BandVariable } from '$types';

interface StacBand {
  name: string;
  description: string;
  'eo:common_name'?: string;
  'eo:center_wavelength'?: number;
  gsd?: number;
}

interface CollectionBand {
  name: string;
  description: string;
  'eo:common_name'?: string;
  'eo:center_wavelength'?: number;
  'eo:full_width_half_max'?: number;
}

/**
 * Extract band variables from a STAC item's reflectance asset.
 *
 * @param stacItem - STAC item containing reflectance asset with band metadata
 * @returns Array of band variables with metadata, or empty array if not found
 *
 * @example
 * ```typescript
 * const bands = extractBandsFromStac(item);
 * // [
 * //   { variable: "B02", name: "b02", label: "Blue", ... },
 * //   { variable: "B03", name: "b03", label: "Green", ... }
 * // ]
 * ```
 */
export function extractBandsFromStac(
  stacItem: StacItem | null | undefined
): BandVariable[] {
  if (!stacItem?.assets?.reflectance?.bands) {
    return [];
  }

  const reflectanceBands = stacItem.assets.reflectance.bands as StacBand[];

  return reflectanceBands.map((band: StacBand) => {
    // Extract label from description: "Blue (band 2)" -> "Blue"
    const label = band.description?.match(/^([^(]+)/)?.[1]?.trim() || band.name;

    // Format resolution: 10 -> "10m"
    const resolution = band.gsd ? `${band.gsd}m` : undefined;

    // Format wavelength: 0.49 -> "490 nm"
    const wavelength = band['eo:center_wavelength']
      ? `${Math.round(band['eo:center_wavelength'] * 1000)} nm`
      : undefined;

    // Generate variable name: b02 -> B02
    const variable = band.name.toUpperCase();

    return {
      variable,
      name: band.name,
      label,
      commonName: band['eo:common_name'],
      resolution,
      wavelength,
      path: `${band.name}`
    };
  });
}

/**
 * Extract band variables from an OpenEO collection's summaries.
 *
 * @param collection - STAC collection containing band metadata in summaries
 * @returns Array of band variables with metadata, or empty array if not found
 *
 * @example
 * ```typescript
 * const bands = extractBandsFromCollection(collection);
 * // [
 * //   { variable: "B02", name: "reflectance|b02", label: "Blue", ... },
 * //   { variable: "B03", name: "reflectance|b03", label: "Green", ... }
 * // ]
 * ```
 */
export function extractBandsFromCollection(
  collection: StacCollection | null | undefined
): BandVariable[] {
  if (!collection?.summaries?.bands) {
    return [];
  }

  const collectionBands = collection.summaries.bands as CollectionBand[];

  // Filter out non-reflectance bands for now (focus on spectral bands)
  const reflectanceBands = collectionBands.filter(
    (band) =>
      band.name.startsWith('reflectance|') ||
      band['eo:common_name'] ||
      band['eo:center_wavelength']
  );

  return reflectanceBands.map((band: CollectionBand) => {
    // Extract label from description: "Blue (band 2)" -> "Blue"
    const label = band.description?.match(/^([^(]+)/)?.[1]?.trim() || band.name;

    // Format wavelength: 0.49 -> "490 nm"
    const wavelength = band['eo:center_wavelength']
      ? `${Math.round(band['eo:center_wavelength'] * 1000)} nm`
      : undefined;

    // Extract variable name from band name: "reflectance|b02" -> "B02"
    const namePart = band.name.includes('|')
      ? band.name.split('|')[1]
      : band.name;
    const variable = namePart.toUpperCase();

    // Determine resolution based on common Sentinel-2 patterns
    let resolution: string | undefined;
    if (namePart.match(/^(b02|b03|b04|b08)$/i)) {
      resolution = '10m';
    } else if (namePart.match(/^(b05|b06|b07|b8a|b11|b12)$/i)) {
      resolution = '20m';
    } else if (namePart.match(/^(b01|b09|b10)$/i)) {
      resolution = '60m';
    }

    return {
      variable,
      name: band.name,
      label,
      commonName: band['eo:common_name'],
      resolution,
      wavelength,
      path: band.name // Use full name including namespace (e.g., "reflectance|b02")
    };
  });
}

/**
 * Group bands by type for better UX in band selection.
 *
 * @param bands - Array of band variables
 * @returns Object with bands grouped by category
 */
export function groupBandsByType(bands: BandVariable[]) {
  const reflectanceBands: BandVariable[] = [];
  const otherBands: BandVariable[] = [];

  bands.forEach((band) => {
    if (band.path.includes('reflectance|') || band.commonName) {
      reflectanceBands.push(band);
    } else {
      otherBands.push(band);
    }
  });

  return {
    reflectance: reflectanceBands.sort((a, b) => a.name.localeCompare(b.name)),
    other: otherBands.sort((a, b) => a.name.localeCompare(b.name))
  };
}
