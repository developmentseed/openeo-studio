/**
 * The UDP document: its process graph, and the references inside it.
 */
import { errors } from './messages';

export type Dict = Record<string, unknown>;

export interface GraphNode {
  process_id: string;
  arguments: Dict;
  namespace?: string;
  description?: string;
  result?: boolean;
}
export type Graph = Record<string, GraphNode>;

export interface UdpParameter {
  name: string;
  description?: string;
  default?: unknown;
  schema?: unknown;
}

// Callback parameters of the openEO processes. Inside a callback they hide a
// UDP parameter with the same name.
export const CALLBACK_PARAMETERS = 'data x y value index label context'.split(
  ' '
);

export const isDict = (v: unknown): v is Dict =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** The id of the node a value refers to. */
export const fromNode = (v: unknown) =>
  isDict(v) && typeof v.from_node === 'string' ? v.from_node : undefined;

/** The name of the parameter a value refers to. */
export const fromParameter = (v: unknown) =>
  isDict(v) && typeof v.from_parameter === 'string'
    ? v.from_parameter
    : undefined;

/** The graph of a callback argument. */
export const childGraph = (v: unknown) =>
  isDict(v) && isDict(v.process_graph) ? v.process_graph : undefined;

/**
 * Checks that a value is a process graph.
 *
 * @throws Error when it is empty or a node has no process
 */
export function toGraph(value: unknown): Graph {
  if (!isDict(value) || Object.keys(value).length === 0) {
    throw new Error(errors.noProcessGraph);
  }
  for (const [id, node] of Object.entries(value)) {
    if (!isDict(node) || typeof node.process_id !== 'string') {
      throw new Error(errors.nodeWithoutProcess(id));
    }
    if (!isDict(node.arguments)) node.arguments = {};
  }
  return value as Graph;
}

/**
 * Calls `visit` with every value in the arguments of a graph, at any depth,
 * until it returns true for one. The graphs of callbacks are not entered.
 */
export function visitValues(graph: Graph, visit: (value: unknown) => boolean) {
  const walk = (value: unknown) => {
    if (visit(value) || childGraph(value)) return;
    if (typeof value === 'object' && value) Object.values(value).forEach(walk);
  };
  Object.values(graph).forEach((node) => walk(node.arguments));
}

/** The parameter names a graph refers to, not counting its own callbacks. */
export function referencedParameters(graph: Graph): Set<string> {
  const found = new Set<string>();
  visitValues(graph, (value) => {
    const parameter = fromParameter(value);
    if (parameter !== undefined) found.add(parameter);
    return parameter !== undefined;
  });
  return found;
}

/** The parameters a UDP declares, by name. */
export function udpParameters(udp: Dict): Map<string, UdpParameter> {
  const parameters = Array.isArray(udp.parameters) ? udp.parameters : [];
  return new Map(
    parameters
      .filter((p): p is UdpParameter => isDict(p) && typeof p.name === 'string')
      .map((p) => [p.name, p])
  );
}

/** The collections a UDP loads by name, in the order of its graph. */
export function udpCollectionIds(udp: unknown): string[] {
  const graph =
    isDict(udp) && isDict(udp.process_graph) ? udp.process_graph : {};
  const ids = Object.values(graph).flatMap((node) =>
    isDict(node) &&
    node.process_id === 'load_collection' &&
    isDict(node.arguments) &&
    typeof node.arguments.id === 'string'
      ? [node.arguments.id]
      : []
  );
  return [...new Set(ids)];
}
