/**
 * Reads the catalogue record of an APEx algorithm
 * (`algorithm_catalog/<provider>/<algorithm>/records/<algorithm>.json`).
 */

/** The link of a catalogue record to its UDP, if it has one. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function udpHref(record: any): string | undefined {
  const links = Array.isArray(record?.links) ? record.links : [];
  const link = links.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (l: any) =>
      l?.rel === 'application' &&
      typeof l.type === 'string' &&
      l.type.includes('openeo') &&
      typeof l.href === 'string'
  );
  return link?.href;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const titleOf = (record: any): string | undefined =>
  typeof record?.properties?.title === 'string'
    ? record.properties.title
    : undefined;
