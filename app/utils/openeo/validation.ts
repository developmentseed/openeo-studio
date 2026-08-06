/**
 * openEO process-graph validation helpers.
 */

import { appConfig } from '$config/runtime';
import type { GraphResult, ValidationError } from '$types';
import { fetchJson } from '../api';

const OPENEO_API_URL = appConfig.openeoApiUrl;

function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) return 'Unknown validation error.';

  return errors
    .map((error) => {
      const code = error.code ? `${error.code}: ` : '';
      const path = error.path ? ` (${error.path})` : '';
      const message = error.message || 'Validation error.';
      return `${code}${message}${path}`;
    })
    .join('\n');
}

async function validateProcessGraph(
  graphResult: GraphResult,
  authToken: string
): Promise<ValidationError[]> {
  const payload = await fetchJson<{ errors?: ValidationError[] }>(
    `${OPENEO_API_URL}/validation`,
    authToken,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        process_graph: graphResult.process_graph,
        parameters: graphResult.parameters
      })
    }
  );

  return Array.isArray(payload?.errors) ? payload.errors : [];
}

/**
 * Validates every graph against the openEO backend, throwing on the first
 * graph that fails validation.
 */
export async function validateGraphs(
  graphs: GraphResult[],
  authToken: string
): Promise<void> {
  for (const [index, graphResult] of graphs.entries()) {
    const errors = await validateProcessGraph(graphResult, authToken);
    if (errors.length > 0) {
      const formattedErrors = formatValidationErrors(errors);
      throw new Error(
        `Validation failed for graph ${index + 1}:\n${formattedErrors}`
      );
    }
  }
}
