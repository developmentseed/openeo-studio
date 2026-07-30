/**
 * Utilities for saving/reading openEO Studio projects as openEO
 * user-defined processes (UDPs), stored via /process_graphs.
 */
import { appConfig } from '$config/runtime';
import type { UserDefinedProcess } from '$types';
import { fetchJson } from './api';

// Matches the openeo-studio code block embedded in a UDP description.
const CODE_BLOCK_PATTERN = /```openeo-studio\n([\s\S]*?)```/;
const CODE_BLOCK_PATTERN_GLOBAL = /```openeo-studio\n[\s\S]*?```/g;

/**
 * Extracts the user's code from a UDP description, if a openeo-studio
 * code block is present.
 */
export function extractCodeFromDescription(
  description: string | undefined
): string | null {
  const match = description?.match(CODE_BLOCK_PATTERN);
  return match ? match[1].trimEnd() : null;
}

/**
 * Builds a UDP description that preserves any existing text (e.g.
 * user-authored notes) while replacing the embedded code block, if any,
 * with the current code.
 */
function buildDescription(
  existingDescription: string | undefined,
  code: string
): string {
  const preserved = (existingDescription ?? '')
    .replace(CODE_BLOCK_PATTERN_GLOBAL, '')
    .trim();
  const codeBlock = `\`\`\`openeo-studio\n${code}\n\`\`\``;

  return preserved ? `${preserved}\n\n${codeBlock}` : codeBlock;
}

interface UpsertUserDefinedProcessParams {
  id: string;
  summary: string;
  code: string;
  processGraph: unknown;
  parameters?: unknown[];
  description?: string;
}

/**
 * Creates or updates (upserts) the user-defined process for a project via
 * PUT /process_graphs/{id}.
 */
export async function upsertUserDefinedProcess(
  authToken: string,
  params: UpsertUserDefinedProcessParams
): Promise<UserDefinedProcess> {
  const newDescription = buildDescription(params.description, params.code);
  const project: UserDefinedProcess = {
    id: params.id,
    summary: params.summary,
    description: newDescription,
    process_graph: params.processGraph,
    parameters: params.parameters
  };

  await fetchJson<UserDefinedProcess | undefined>(
    `${appConfig.openeoApiUrl}/process_graphs/${params.id}`,
    authToken,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project)
    }
  );

  return project;
}
