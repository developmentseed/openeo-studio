/**
 * Utilities for saving/reading openEO Studio projects as openEO
 * user-defined processes (UDPs), stored via /process_graphs.
 */
import { isEqual } from 'lodash-es';
import { appConfig } from '$config/runtime';
import type { UserDefinedProcess } from '$types';
import type {
  ProcessGraph,
  ProcessNode,
  ProcessParameter,
  ProcessArgumentValue
} from '$types/openeo-process';
import { fetchJson } from '../api';

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

export function findLoadCollectionId(
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

function namespaceNodeId(graphIndex: number, nodeId: string): string {
  return `g${graphIndex}_${nodeId}`;
}

/**
 * Rewrites from_node references inside a process node argument using
 * `resolve`, which maps a node id (local to the graph currently being
 * processed) to its final id in the merged graph. Recurses into plain
 * objects/arrays, but a nested `{ process_graph: ... }` argument (a callback
 * graph, e.g. a reducer) is returned as-is: it's flattened into its own
 * self-contained dict whose from_node references only ever point at sibling
 * nodes inside that same dict, never at the outer graph being merged here.
 */
function renameNodeReferences(
  value: unknown,
  resolve: (localNodeId: string) => string
): ProcessArgumentValue {
  if (Array.isArray(value)) {
    return value.map((item) => renameNodeReferences(item, resolve));
  }

  if (value !== null && typeof value === 'object') {
    const obj = value as Record<string, unknown>;

    if (typeof obj.from_node === 'string') {
      return { from_node: resolve(obj.from_node) };
    }

    if ('process_graph' in obj) {
      return value as ProcessArgumentValue;
    }

    const result: Record<string, ProcessArgumentValue> = {};
    for (const [key, v] of Object.entries(obj)) {
      result[key] = renameNodeReferences(v, resolve);
    }
    return result;
  }

  return value as ProcessArgumentValue;
}

function renameArgumentReferences(
  args: Record<string, ProcessArgumentValue>,
  resolve: (localNodeId: string) => string
): Record<string, ProcessArgumentValue> {
  const result: Record<string, ProcessArgumentValue> = {};
  for (const [key, value] of Object.entries(args)) {
    result[key] = renameNodeReferences(value, resolve);
  }
  return result;
}

/**
 * Combines multiple independently-flattened process graphs (one per
 * add_graph_to_map() call in a single script execution) into a single graph
 * suitable for persisting as one UDP via /process_graphs, without
 * duplicating nodes that are identical across graphs.
 *
 * Each input graph was produced by its own PGNode.flat_graph() call, so its
 * auto-numbered node ids (loadcollection1, applypixelselection1, ...)
 * restart from 1 independently: same-named nodes across graphs can refer to
 * different things (a naive merge would silently overwrite one with the
 * other), while different-named-or-not nodes are frequently the *same*
 * thing (every graph in one execution branches off the same datacube built
 * once in algorithms/base/loader.py).
 *
 * This is resolved with bottom-up content-addressable deduplication: each
 * node's canonical identity is `{ process_id, namespace, arguments }` with
 * every from_node reference already pointing at its *dependency's* final
 * merged id (computed the same way, recursively/memoized — a node's inputs
 * are always resolved before the node itself). If a node with that exact
 * canonical identity (per lodash's `isEqual`) already exists in the merged
 * graph (from this graph or an earlier one), it's reused; otherwise a new
 * node is added with an id namespaced by source graph index (g0_..., g1_...).
 * A single input graph is returned unchanged (nothing to merge or dedup, and
 * it keeps the common single-graph case's node ids stable).
 *
 * An openEO process graph may have exactly one `result: true` node, so only
 * graphs[0]'s result node keeps the flag; it's cleared (omitted) on every
 * other graph's result node, even if that node happens to dedup against an
 * earlier one.
 */
export function mergeProcessGraphs(graphs: ProcessGraph[]): ProcessGraph {
  if (graphs.length === 0) {
    throw new Error('mergeProcessGraphs requires at least one process graph.');
  }
  if (graphs.length === 1) {
    return graphs[0];
  }

  const merged: ProcessGraph = {};
  const canonicalEntries: {
    key: {
      process_id: string;
      namespace: string | null;
      arguments: Record<string, ProcessArgumentValue>;
    };
    mergedId: string;
  }[] = [];

  graphs.forEach((graph, graphIndex) => {
    const localIdMap = new Map<string, string>();
    const visiting = new Set<string>();

    function resolve(nodeId: string): string {
      const cached = localIdMap.get(nodeId);
      if (cached) return cached;

      const node = graph[nodeId];
      if (!node) {
        throw new Error(
          `mergeProcessGraphs: from_node reference to unknown node "${nodeId}" in graph ${graphIndex}.`
        );
      }
      if (visiting.has(nodeId)) {
        throw new Error(
          `mergeProcessGraphs: cycle detected in graph ${graphIndex} at node "${nodeId}".`
        );
      }
      visiting.add(nodeId);

      const rewrittenArgs = renameArgumentReferences(node.arguments, resolve);
      const canonicalKey = {
        process_id: node.process_id,
        namespace: node.namespace ?? null,
        arguments: rewrittenArgs
      };

      const existing = canonicalEntries.find((entry) =>
        isEqual(entry.key, canonicalKey)
      );

      let mergedId: string;
      if (existing) {
        mergedId = existing.mergedId;
      } else {
        mergedId = namespaceNodeId(graphIndex, nodeId);
        const mergedNode: ProcessNode = { ...node, arguments: rewrittenArgs };
        if (node.result && graphIndex === 0) {
          mergedNode.result = true;
        } else {
          delete mergedNode.result;
        }
        merged[mergedId] = mergedNode;
        canonicalEntries.push({ key: canonicalKey, mergedId });
      }

      visiting.delete(nodeId);
      localIdMap.set(nodeId, mergedId);
      return mergedId;
    }

    for (const nodeId of Object.keys(graph)) {
      resolve(nodeId);
    }
  });

  return merged;
}

/**
 * Resolves the single parameters list shared across every GraphResult
 * produced by one script execution. All graphs in one execution are built
 * from the same openEO Parameter objects, constructed once in
 * algorithms/base/loader.py and reused for every add_graph_to_map() call, so
 * every graph's parameters list is expected to be identical — but that's an
 * assumption about Python-side behavior this module can't see, so it's
 * verified here (via lodash's `isEqual` for structural equality) rather than
 * blindly trusting parameterSets[0]. A saved UDP has exactly one parameters
 * list, so a mismatch would mean silently losing one graph's declared
 * parameters.
 */
export function resolveSharedParameters(
  parameterSets: ProcessParameter[][]
): ProcessParameter[] {
  if (parameterSets.length === 0) {
    throw new Error(
      'resolveSharedParameters requires at least one parameter set.'
    );
  }

  const [first, ...rest] = parameterSets;

  const mismatchIndex = rest.findIndex((params) => !isEqual(params, first));
  if (mismatchIndex !== -1) {
    throw new Error(
      `Graph result parameters differ between graph 0 and graph ${
        mismatchIndex + 1
      }; expected every graph produced by one script execution to share the same parameters.`
    );
  }

  return first;
}
