/**
 * Where to come back to after sign-in. Keeps the query string so deep links
 * like /editor?project_url=… survive the OIDC round trip.
 */
export function returnPath(location: {
  pathname: string;
  search: string;
}): string {
  return location.pathname + location.search;
}
