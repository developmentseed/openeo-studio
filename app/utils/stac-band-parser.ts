/**
 * STAC Band Parsing Utilities
 *
 * Extract band metadata from STAC items for display in the editor.
 * Supports Sentinel-2 L2A reflectance band structure.
 */
import type { StacCollection } from 'stac-ts';

import type { BandVariable } from '$types';

interface CollectionBand {
  name: string;
  description: string;
  'eo:common_name'?: string;
  'eo:center_wavelength'?: number;
  'eo:full_width_half_max'?: number;
}

/**
 * Extract band variables from a STAC collection's summaries.
 *
 * @param stacCollection - STAC collection containing summaries with band metadata
 * @returns Array of band variables with metadata, or empty array if not found
 *
 * @example
 * ```typescript
 * const bands = extractBandsFromStac(collection);
 * // [
 * //   { variable: "B02", name: "b02", label: "Blue", ... },
 * //   { variable: "B03", name: "b03", label: "Green", ... }
 * // ]
 * ```
 */
export function extractBandsFromStac(
  stacCollection: StacCollection | null | undefined
): BandVariable[] {
  if (!stacCollection?.summaries?.bands) {
    return [];
  }

  const reflectanceBands = stacCollection.summaries.bands as CollectionBand[];
  return reflectanceBands
    .filter(
      (band) =>
        band.name.startsWith('reflectance|') ||
        band['eo:common_name'] ||
        band['eo:center_wavelength']
    )
    .map((band: CollectionBand) => {
      // Extract label from description: "Blue (band 2)" -> "Blue"
      const label =
        band.description?.match(/^([^(]+)/)?.[1]?.trim() || band.name;

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
