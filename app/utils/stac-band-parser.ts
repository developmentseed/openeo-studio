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
  common_name?: string;
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

  // Some catalogues list the same band more than once - keep the first.
  const seen = new Set<string>();
  const reflectanceBands = (summariesBands as CollectionBand[]).filter(
    (band) => {
      if (!band?.name || seen.has(band.name)) return false;
      seen.add(band.name);
      return true;
    }
  );
  return reflectanceBands.map((band: CollectionBand) => {
    // Extract label from description: "Blue (band 2)" -> "Blue"
    const label = band.description?.match(/^([^(]+)/)?.[1]?.trim() || band.name;

    // Format wavelength: 0.49 -> "490 nm"
    const wavelength = band['eo:center_wavelength']
      ? `${Math.round(band['eo:center_wavelength'] * 1000)} nm`
      : undefined;

    // Extract variable name from band name: "reflectance|b02" or
    // "reflectance|bands=b02" -> "b02"
    const namePart = band.name.includes('|')
      ? band.name.split('|')[1].replace(/^bands=/, '')
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
      commonName: band['eo:common_name'] ?? band.common_name,
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

/**
 * Raw band name inside a multi-band asset: "reflectance|bands=b04" or
 * "reflectance|b04" -> "b04". Returns undefined for a plain name.
 */
function rawBandName(name: string): string | undefined {
  if (!name.includes('|')) return undefined;
  const raw = name.slice(name.lastIndexOf('|') + 1).replace(/^bands=/, '');
  return raw || undefined;
}

/**
 * All the references a backend accepts for one band: the advertised name,
 * the raw band name inside a multi-band asset, and the EO common name
 * (titiler-openeo resolves each of them).
 */
export function bandIdentifiers(band: BandVariable): string[] {
  const ids = [band.name, rawBandName(band.name), band.commonName];
  return ids.filter((id): id is string => !!id);
}

/**
 * Find the band that a band reference (advertised name, raw name or common
 * name) points to. An exact advertised name always wins.
 */
export function findBandByReference(
  reference: string,
  bands: BandVariable[]
): BandVariable | undefined {
  return (
    bands.find((band) => band.name === reference) ??
    bands.find((band) => bandIdentifiers(band).includes(reference))
  );
}

/**
 * The set of band references that a collection accepts. It uses the bands
 * from summaries.bands and from the bands cube:dimension, because a backend
 * can advertise loadable bands in either place.
 */
export function collectionBandIdentifiers(
  stacCollection: StacCollection | null | undefined
): Set<string> {
  if (!stacCollection) {
    return new Set();
  }
  const bands = [
    ...extractBandsFromSummaries(stacCollection),
    ...extractBandsFromCubeDimensions(stacCollection)
  ];
  return new Set(bands.flatMap(bandIdentifiers));
}

/**
 * A collection is compatible when it can resolve every selected band
 * reference. With no selected band, it must provide at least one band.
 */
export function isCollectionCompatible(
  stacCollection: StacCollection | null | undefined,
  selectedBands: string[]
): boolean {
  const identifiers = collectionBandIdentifiers(stacCollection);
  if (identifiers.size === 0) {
    return false;
  }
  return selectedBands.every((reference) => identifiers.has(reference));
}
