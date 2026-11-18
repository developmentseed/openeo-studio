/**
 * Reads the error that the openEO backend sends for a tile, and gives the
 * user advice. titiler-openeo refuses a tile when the area and the dates
 * select no image (`NoDataAvailable`) or more images than its limit
 * (`ItemsLimitExceeded`, 20 by default).
 */

export interface TileError {
  /** The openEO error code, for example `NoDataAvailable`. */
  code: string;
  /** The message of the backend. */
  message: string;
  /** What the user can change. Empty when there is no advice. */
  advice: string;
}

const ADVICE: Record<string, string> = {
  NoDataAvailable:
    'There is no image for these dates in this area. Use a longer date range, or a higher cloud cover limit.',
  ItemsLimitExceeded:
    'Too many images for this view. Use a shorter date range or a lower cloud cover limit, or zoom in.',
  OutputLimitExceeded:
    'The result is too large for this view. Zoom in, or select fewer bands.'
};

/** Parses the body of a failed tile response. */
export function parseTileError(status: number, body: string): TileError {
  let code = `HTTP ${status}`;
  let message = body.trim().slice(0, 500);
  try {
    const json = JSON.parse(body) as { code?: unknown; message?: unknown };
    if (typeof json.code === 'string') code = json.code;
    if (typeof json.message === 'string') message = json.message;
  } catch {
    // Not JSON: keep the text.
  }
  return { code, message, advice: ADVICE[code] ?? '' };
}

/** The status and the body of a MapLibre AJAXError, or null. */
export async function readAjaxError(
  error: unknown
): Promise<{ status: number; body: string } | null> {
  if (!error || typeof error !== 'object') return null;
  const { status, body } = error as { status?: unknown; body?: unknown };
  if (typeof status !== 'number') return null;
  let text = '';
  if (body instanceof Blob) {
    try {
      text = await body.text();
    } catch {
      text = '';
    }
  } else if (typeof body === 'string') {
    text = body;
  }
  return { status, body: text };
}
