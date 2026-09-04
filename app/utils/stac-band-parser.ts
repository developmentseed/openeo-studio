/**
 * STAC Band Parsing Utilities
 *
 * Extract band metadata from STAC collections for display in the editor.
 * Backends publish band info in different, both-valid shapes:
 *   - summaries.bands: rich per-band objects (seen from the EOPF explorer
 *     backend) - handled by extractBandsFromSummaries.
 *   - cube:dimensions.<name>.values on a "bands"-type dimension: a bare
 *     list of band-name strings (the openEO datacube extension, seen from
 *     other openEO backends e.g. openeo.ds.io) - handled by
 *     extractBandsFromCubeDimensions.
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

interface CubeDimension {
  type?: string;
  values?: unknown;
}

function extractBandsFromSummaries(
  stacCollection: StacCollection
): BandVariable[] {
  const summariesBands = stacCollection.summaries?.bands;
  if (!Array.isArray(summariesBands)) {
    return [];
  }

  const reflectanceBands = summariesBands as CollectionBand[];
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
      name: band.name,
      label,
      commonName: band['eo:common_name'],
      resolution,
      wavelength
    };
  });
}

function extractBandsFromCubeDimensions(
  stacCollection: StacCollection
): BandVariable[] {
  const dimensions = stacCollection['cube:dimensions'] as
    | Record<string, CubeDimension>
    | undefined;
  const bandsDimension = Object.values(dimensions ?? {}).find(
    (dim) => dim?.type === 'bands' && Array.isArray(dim.values)
  );
  if (!bandsDimension) {
    return [];
  }

  return (bandsDimension.values as string[]).map((name) => {
    // These band names often carry their resolution as a suffix, e.g.
    // "B04_20m" - pull it out for display, but keep `name` unchanged since
    // it's the literal identifier openEO process graphs must reference.
    const resolutionMatch = name.match(/_(\d+m)$/i);
    return {
      name,
      label: resolutionMatch ? name.slice(0, resolutionMatch.index) : name,
      resolution: resolutionMatch?.[1]
    };
  });
}

/**
 * Extract band variables from a STAC collection.
 *
 * @param stacCollection - STAC collection containing band metadata
 * @returns Array of band variables with metadata, or empty array if not found
 *
 * @example
 * ```typescript
 * const bands = extractBandsFromStac(collection);
 * // [
 * //   { name: "b02", label: "Blue", ... },
 * //   { name: "b03", label: "Green", ... }
 * // ]
 * ```
 */
export function extractBandsFromStac(
  stacCollection: StacCollection | null | undefined
): BandVariable[] {
  if (!stacCollection) {
    return [];
  }

  const summaryBands = extractBandsFromSummaries(stacCollection);
  if (summaryBands.length > 0) {
    return summaryBands;
  }

  return extractBandsFromCubeDimensions(stacCollection);
}
