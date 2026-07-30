/**
 * Utilities for saving/reading openEO Studio projects as openEO
 * user-defined processes (UDPs), stored via /process_graphs.
 */
import { appConfig } from '$config/runtime';
import type { UserDefinedProcess } from '$types';
import type { ProcessGraph, ProcessParameter } from '$types/openeo-process';
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
export function buildDescription(
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
  processGraph: ProcessGraph;
  parameters?: ProcessParameter[];
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

export interface DerivedProjectConfig {
  collectionId?: string;
  temporalRange?: [string, string];
  cloudCover?: number;
  selectedBands?: string[];
  boundingBox?: [number, number, number, number];
}

function findParameterDefault(
  parameters: ProcessParameter[] | undefined,
  name: string
): unknown {
  return parameters?.find((p) => p.name === name)?.default;
}

function findLoadCollectionId(
  processGraph: ProcessGraph | undefined
): string | undefined {
  if (!processGraph) return undefined;
  for (const node of Object.values(processGraph)) {
    if (node.process_id === 'load_collection') {
      const id = node.arguments.id;
      if (typeof id === 'string') {
        return id;
      }
    }
  }
  return undefined;
}

/**
 * Reverse-derives editor config from a saved project's process graph and
 * parameters. Mirrors how algorithms/base/loader.py builds them: each
 * parameter serializes to { name, default, ... }, and collectionId lives on
 * the load_collection node's arguments.id. Any field that can't be found or
 * doesn't match the expected shape is simply omitted, never thrown.
 */
export function deriveConfigFromProject(
  project: UserDefinedProcess
): DerivedProjectConfig {
  const config: DerivedProjectConfig = {};

  const collectionId = findLoadCollectionId(project.process_graph);
  if (collectionId) {
    config.collectionId = collectionId;
  }

  const temporalRange = findParameterDefault(project.parameters, 'time');
  if (
    Array.isArray(temporalRange) &&
    temporalRange.length === 2 &&
    typeof temporalRange[0] === 'string' &&
    typeof temporalRange[1] === 'string'
  ) {
    config.temporalRange = [temporalRange[0], temporalRange[1]];
  }

  const selectedBands = findParameterDefault(project.parameters, 'bands');
  if (
    Array.isArray(selectedBands) &&
    selectedBands.every((band) => typeof band === 'string')
  ) {
    config.selectedBands = selectedBands as string[];
  }

  const cloudCover = findParameterDefault(
    project.parameters,
    'cloud_cover_max'
  );
  if (typeof cloudCover === 'number') {
    config.cloudCover = cloudCover;
  }

  const boundingBox = findParameterDefault(
    project.parameters,
    'bounding_box'
  ) as
    | { west?: unknown; south?: unknown; east?: unknown; north?: unknown }
    | undefined;
  if (
    boundingBox &&
    typeof boundingBox.west === 'number' &&
    typeof boundingBox.south === 'number' &&
    typeof boundingBox.east === 'number' &&
    typeof boundingBox.north === 'number'
  ) {
    config.boundingBox = [
      boundingBox.west,
      boundingBox.south,
      boundingBox.east,
      boundingBox.north
    ];
  }

  return config;
}
