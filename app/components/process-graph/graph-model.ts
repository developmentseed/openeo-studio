import type { ProcessArgumentValue, ProcessGraph } from '$types/openeo-process';

import { formatArgumentValue } from './format-value';

export type ArgumentKind = 'edge' | 'parameter-ref' | 'subgraph' | 'literal';

export interface SubgraphRef {
  graph: ProcessGraph;
  /**
   * Dotted path from the argument root to the object holding `process_graph`.
   * Empty when the argument value is itself that object.
   */
  path: string;
  nodeCount: number;
}

export interface ArgumentView {
  name: string;
  kind: ArgumentKind;
  display: string;
  /** Full JSON, present only when `display` abbreviates the value. */
  full?: string;
  /** Boolean literals; the node renders LuCheck / LuXmark instead of text. */
  glyph?: 'check' | 'cross';
  /** True when at least one edge terminates on this argument. */
  wired: boolean;
  subgraph?: SubgraphRef;
}

export interface ProcessNodeView {
  id: string;
  processId: string;
  /** Collection id for load_collection, otherwise processId. */
  title: string;
  namespace?: string;
  isResult: boolean;
  isCollection: boolean;
  description?: string;
  args: ArgumentView[];
}

export interface GraphEdgeView {
  id: string;
  source: string;
  target: string;
  targetHandle: string;
  /** Set only when the target node has more than one wired argument. */
  label?: string;
}

export interface GraphView {
  nodes: ProcessNodeView[];
  edges: GraphEdgeView[];
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Collects the ids referenced by `{from_node: ...}` anywhere in an argument
 * value, without descending into a nested process graph: those references
 * point at siblings inside the subgraph, never at the graph being rendered.
 * Same rule `renameNodeReferences` applies in `$utils/process-graphs`.
 */
function collectNodeRefs(value: unknown, out: Set<string>): void {
  if (Array.isArray(value)) {
    for (const item of value) collectNodeRefs(item, out);
    return;
  }
  if (!isPlainObject(value)) return;
  if (typeof value.from_node === 'string') {
    out.add(value.from_node);
    return;
  }
  if ('process_graph' in value) return;
  for (const nested of Object.values(value)) collectNodeRefs(nested, out);
}

/**
 * Finds the first nested process graph under an argument value, recording the
 * dotted path to it. ModelBuilder only inspects the argument's top level,
 * which is why it cannot see the graph inside
 * `load_collection.properties["eo:cloud_cover"]`. An argument holding more
 * than one subgraph is not something the openEO Python client produces, so
 * only the first is surfaced.
 */
function findSubgraph(value: unknown, path: string): SubgraphRef | undefined {
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      const found = findSubgraph(item, path ? `${path}.${index}` : `${index}`);
      if (found) return found;
    }
    return undefined;
  }

  if (!isPlainObject(value)) return undefined;

  if (isPlainObject(value.process_graph)) {
    const graph = value.process_graph as ProcessGraph;
    return { graph, path, nodeCount: Object.keys(graph).length };
  }

  for (const [key, nested] of Object.entries(value)) {
    const found = findSubgraph(nested, path ? `${path}.${key}` : key);
    if (found) return found;
  }
  return undefined;
}

function isWholeValueNodeRef(value: ProcessArgumentValue): boolean {
  return isPlainObject(value) && typeof value.from_node === 'string';
}

function isParameterRef(value: ProcessArgumentValue): boolean {
  return isPlainObject(value) && typeof value.from_parameter === 'string';
}

function buildArgument(
  name: string,
  value: ProcessArgumentValue,
  refs: Set<string>
): ArgumentView {
  const subgraph = findSubgraph(value, '');
  if (subgraph) {
    return { name, kind: 'subgraph', display: '', wired: false, subgraph };
  }

  if (refs.size > 0) {
    // A lone reference needs no text: the incoming edge already says where the
    // data comes from. References nested in an array or object still render,
    // because there the edge alone cannot say which element it feeds.
    if (isWholeValueNodeRef(value)) {
      return { name, kind: 'edge', display: '', wired: true };
    }
    const { display, full } = formatArgumentValue(value, name);
    return { name, kind: 'edge', display, full, wired: true };
  }

  const { display, full, glyph } = formatArgumentValue(value, name);
  const kind: ArgumentKind = isParameterRef(value)
    ? 'parameter-ref'
    : 'literal';
  return { name, kind, display, full, glyph, wired: false };
}

/**
 * Builds the renderable description of a process graph: one node per entry,
 * one edge per `from_node` reference. Node ids are reused verbatim so that
 * drill-down breadcrumbs and edge ids stay readable.
 */
export function buildGraphView(graph: ProcessGraph): GraphView {
  const nodes: ProcessNodeView[] = [];
  const refsByNode = new Map<string, Map<string, Set<string>>>();

  for (const [id, node] of Object.entries(graph)) {
    const isCollection =
      node.process_id === 'load_collection' &&
      typeof node.arguments.id === 'string';

    const refsByArg = new Map<string, Set<string>>();
    const args: ArgumentView[] = [];

    for (const [name, value] of Object.entries(node.arguments)) {
      // The collection id is already the node title; repeating it is noise.
      if (isCollection && name === 'id') continue;

      const refs = new Set<string>();
      collectNodeRefs(value, refs);
      if (refs.size > 0) refsByArg.set(name, refs);

      args.push(buildArgument(name, value, refs));
    }

    refsByNode.set(id, refsByArg);
    nodes.push({
      id,
      processId: node.process_id,
      title: isCollection ? (node.arguments.id as string) : node.process_id,
      namespace: node.namespace ?? undefined,
      isResult: node.result === true,
      isCollection,
      description: node.description,
      args
    });
  }

  const edges: GraphEdgeView[] = [];
  for (const [target, refsByArg] of refsByNode) {
    const labelEdges = refsByArg.size > 1;
    for (const [targetHandle, refs] of refsByArg) {
      for (const source of refs) {
        if (!graph[source]) continue;
        edges.push({
          id: `${source}->${target}:${targetHandle}`,
          source,
          target,
          targetHandle,
          ...(labelEdges ? { label: targetHandle } : {})
        });
      }
    }
  }

  return { nodes, edges };
}
