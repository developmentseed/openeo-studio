/**
 * Base map layers for the map viewer.
 *
 * Precedence: the BASEMAPS runtime setting, then the MapTiler presets when a
 * MapTiler key is set, then free base maps that need no key.
 */

import { kebabCase } from 'lodash-es';
import type { StyleSpecification } from 'maplibre-gl';

export type BaseMapStyle = string | StyleSpecification;

export interface BaseLayer {
  id: string;
  label: string;
  style: {
    light: BaseMapStyle;
    dark: BaseMapStyle;
  };
}

/** One entry of the BASEMAPS setting. At least one of light/dark is set. */
export interface BaseMapEntry {
  label: string;
  light?: string;
  dark?: string;
  attribution?: string;
  maxzoom?: number;
}

/**
 * Turns a URL into a MapLibre style. A URL with a `{z}` placeholder is a
 * raster tile template and gets a minimal one-layer style; any other URL is a
 * style URL and is used as is.
 */
export function toMapStyle(
  url: string,
  { attribution, maxzoom }: Pick<BaseMapEntry, 'attribution' | 'maxzoom'> = {}
): BaseMapStyle {
  // A tile layer will have {x}, {y}, and {z} placeholders. A style URL will not.
  if (!url.includes('{z}')) return url;

  return {
    version: 8,
    sources: {
      basemap: {
        type: 'raster',
        tiles: [url],
        tileSize: 256,
        ...(maxzoom ? { maxzoom } : {}),
        ...(attribution ? { attribution } : {})
      }
    },
    layers: [{ id: 'basemap', type: 'raster', source: 'basemap' }]
  };
}

function toBaseLayers(entries: BaseMapEntry[]): BaseLayer[] {
  const usedIds = new Set<string>();

  return entries.map((entry, index) => {
    const base = kebabCase(entry.label) || `basemap-${index + 1}`;
    let id = base;
    for (let n = 2; usedIds.has(id); n++) id = `${base}-${n}`;
    usedIds.add(id);

    // Only one of light/dark may be set; it is then used for both modes.
    const light = (entry.light || entry.dark)!;
    const dark = (entry.dark || entry.light)!;

    return {
      id,
      label: entry.label,
      style: {
        light: toMapStyle(light, entry),
        dark: toMapStyle(dark, entry)
      }
    };
  });
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim() !== '';

/**
 * Parses the BASEMAPS setting (a JSON array of {@link BaseMapEntry}). Throws
 * an Error that names the problem when the value is not valid.
 */
export function parseBaseMaps(raw: string): BaseMapEntry[] {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch (error) {
    throw new Error(`not valid JSON (${(error as Error).message})`);
  }

  if (!Array.isArray(value) || value.length === 0) {
    throw new Error('must be a non-empty JSON array');
  }

  return value.map((item, index) => {
    const where = `entry ${index + 1}`;
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      throw new Error(`${where} must be an object`);
    }

    const { label, light, dark, attribution, maxzoom } = item as Record<
      string,
      unknown
    >;
    if (!isNonEmptyString(label)) {
      throw new Error(`${where} needs a "label"`);
    }
    for (const [key, field] of Object.entries({ light, dark, attribution })) {
      if (field !== undefined && typeof field !== 'string') {
        throw new Error(`${where} ("${label}"): "${key}" must be a string`);
      }
    }
    if (!isNonEmptyString(light) && !isNonEmptyString(dark)) {
      throw new Error(`${where} ("${label}") needs a "light" or "dark" URL`);
    }
    if (maxzoom !== undefined && typeof maxzoom !== 'number') {
      throw new Error(`${where} ("${label}"): "maxzoom" must be a number`);
    }

    return {
      label,
      light: isNonEmptyString(light) ? light : undefined,
      dark: isNonEmptyString(dark) ? dark : undefined,
      attribution: isNonEmptyString(attribution) ? attribution : undefined,
      maxzoom
    };
  });
}

const maptilerStyleUrl = (mapId: string, key: string) =>
  `https://api.maptiler.com/maps/${mapId}/style.json?key=${key}`;

function maptilerBaseLayers(key: string): BaseLayer[] {
  return [
    {
      id: 'satellite',
      label: 'Satellite',
      style: {
        light: maptilerStyleUrl('satellite-v4', key),
        dark: maptilerStyleUrl('satellite-v4-dark', key)
      }
    },
    {
      id: 'streets',
      label: 'Streets',
      style: {
        light: maptilerStyleUrl('streets-v4', key),
        dark: maptilerStyleUrl('streets-v4-dark', key)
      }
    },
    {
      id: 'topographic',
      label: 'Topographic',
      style: {
        light: maptilerStyleUrl('topo-v4', key),
        dark: maptilerStyleUrl('topo-v4-dark', key)
      }
    }
  ];
}

/** Base maps used when neither BASEMAPS nor a MapTiler key is set. */
export const DEFAULT_BASE_MAPS: BaseMapEntry[] = [
  {
    label: 'Satellite',
    light:
      'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g/{z}/{y}/{x}.jpg',
    maxzoom: 18, // EOX has no tiles beyond zoom 18
    attribution:
      '<a href="https://s2maps.eu" target="_blank">Sentinel-2 cloudless</a> by <a href="https://eox.at" target="_blank">EOX IT Services GmbH</a> (Contains modified Copernicus Sentinel data 2016)'
  },
  {
    label: 'Streets',
    light: 'https://tiles.openfreemap.org/styles/positron',
    dark: 'https://tiles.openfreemap.org/styles/dark'
  }
];

interface ResolveBaseLayersOptions {
  /** Raw BASEMAPS setting (JSON). Empty when not set. */
  basemaps: string;
  maptilerKey: string;
  /** Called with the reason when BASEMAPS is set but not valid. */
  onInvalid?: (reason: string) => void;
}

export function resolveBaseLayers({
  basemaps,
  maptilerKey,
  onInvalid
}: ResolveBaseLayersOptions): BaseLayer[] {
  if (basemaps.trim()) {
    try {
      return toBaseLayers(parseBaseMaps(basemaps));
    } catch (error) {
      onInvalid?.((error as Error).message);
    }
  }

  if (maptilerKey) return maptilerBaseLayers(maptilerKey);

  return toBaseLayers(DEFAULT_BASE_MAPS);
}
