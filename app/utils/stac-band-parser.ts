/**
 * STAC Band Parsing Utilities
 *
 * Extract band metadata from STAC items for display in the editor.
 * Supports Sentinel-2 L2A reflectance band structure.
 */
import type { StacItem } from 'stac-ts';

export interface BandVariable {
  /** Variable name (e.g., "B02") */
  variable: string;
  /** Band identifier in lowercase (e.g., "b02") */
  name: string;
  /** Human-readable label (e.g., "Blue") */
  label: string;
  /** Common name from EO extension (e.g., "blue") */
  commonName?: string;
  /** Spatial resolution (e.g., "10m") */
  resolution?: string;
  /** Center wavelength (e.g., "490 nm") */
  wavelength?: string;
  /** Full path for datacube.band() (e.g., "reflectance|b02") */
  path: string;
}

interface StacBand {
  name: string;
  description: string;
  'eo:common_name'?: string;
  'eo:center_wavelength'?: number;
  gsd?: number;
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
      path: `reflectance|${band.name}`
    };
  });
}
