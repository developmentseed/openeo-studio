import type { ProcessArgumentValue } from '$types/openeo-process';

/**
 * The two renderings of an argument value: the abbreviated text that fits in a
 * node row, and — only when abbreviating loses information — the full JSON
 * shown in the row's popover. Booleans set `glyph` so the node can render a
 * Lucide icon instead of text.
 */
export interface FormattedValue {
  display: string;
  full?: string;
  /** Present for boolean literals; the node renders LuCheck / LuXmark. */
  glyph?: 'check' | 'cross';
}

/**
 * Character budget for the value text, shared with the label, so that a very
 * long parameter name still leaves room for something readable.
 */
const BASE_BUDGET = 24;
const MIN_BUDGET = 8;

/** Per-element budget when summarising an array. */
const ELEMENT_BUDGET = 10;

const GEOJSON_TYPES = new Set([
  'Point',
  'MultiPoint',
  'LineString',
  'MultiLineString',
  'Polygon',
  'MultiPolygon',
  'GeometryCollection',
  'Feature',
  'FeatureCollection'
]);

function budgetFor(label: string): number {
  return Math.max(BASE_BUDGET - label.length, MIN_BUDGET);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isBoundingBox(value: Record<string, unknown>): boolean {
  return (['west', 'south', 'east', 'north'] as const).every(
    (key) => typeof value[key] === 'number'
  );
}

function isGeoJson(value: Record<string, unknown>): boolean {
  return typeof value.type === 'string' && GEOJSON_TYPES.has(value.type);
}

function truncate(text: string, budget: number): string {
  return text.length <= budget ? text : `${text.slice(0, budget)}…`;
}

function pretty(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

/**
 * One-line rendering used for array elements, where there is only room for a
 * token per item.
 */
function formatCompact(value: unknown): string {
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return truncate(value, ELEMENT_BUDGET);
  if (value === null) return 'n/a';
  if (Array.isArray(value)) return `List(${value.length})`;
  if (isPlainObject(value)) {
    if (typeof value.from_parameter === 'string') {
      return `$${value.from_parameter}`;
    }
    if (typeof value.from_node === 'string') return `← ${value.from_node}`;
    return 'Object';
  }
  return 'Object';
}

/**
 * Formats a bound argument value for display in a process node row.
 *
 * `full` is populated whenever `display` does not round-trip the value, which
 * is every case except booleans, numbers, untruncated strings, and null. The
 * node component uses its presence to decide whether the row gets a popover.
 *
 * Arguments holding a nested process graph are handled by `graph-model` before
 * reaching here; the `process_graph` branch below is only a safety net.
 */
export function formatArgumentValue(
  value: ProcessArgumentValue,
  label: string
): FormattedValue {
  const budget = budgetFor(label);

  if (typeof value === 'boolean') {
    return {
      display: value ? 'true' : 'false',
      glyph: value ? 'check' : 'cross'
    };
  }
  if (typeof value === 'number') return { display: String(value) };
  if (value === null) return { display: 'n/a' };

  if (typeof value === 'string') {
    return value.length <= budget
      ? { display: value }
      : { display: truncate(value, budget), full: pretty(value) };
  }

  if (Array.isArray(value)) {
    const joined = value.map(formatCompact).join(', ');
    return {
      display:
        value.length > 0 && joined.length <= budget
          ? joined
          : `List(${value.length})`,
      full: pretty(value)
    };
  }

  if (isPlainObject(value)) {
    const full = pretty(value);

    // A reference renders in full, so there is nothing for a popover to add.
    if (typeof value.from_parameter === 'string') {
      return { display: `$${value.from_parameter}` };
    }
    if (typeof value.from_node === 'string') {
      return { display: `← ${value.from_node}` };
    }
    if (isPlainObject(value.process_graph)) {
      return { display: 'Process', full };
    }
    if (Object.keys(value).length === 0) return { display: 'None' };
    if (isBoundingBox(value)) return { display: 'Bounding Box', full };
    if (isGeoJson(value)) {
      return { display: truncate(value.type as string, budget), full };
    }
    return { display: 'Object', full };
  }

  return { display: 'Object', full: pretty(value) };
}
