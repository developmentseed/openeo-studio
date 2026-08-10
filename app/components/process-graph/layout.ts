import dagre from '@dagrejs/dagre';

/**
 * Fixed block width, matching ModelBuilder's `normalParams`. Only height
 * varies, driven by the number of argument rows.
 */
export const NODE_WIDTH = 220;

const NODE_SEPARATION = 24;
const RANK_SEPARATION = 48;

export interface LayoutNode {
  id: string;
  width: number;
  height: number;
}

export interface LayoutEdge {
  source: string;
  target: string;
}

export type LayoutPositions = Record<string, { x: number; y: number }>;

/**
 * Runs a layered top-to-bottom layout over measured node dimensions.
 *
 * Dagre reports a node's centre; React Flow positions nodes by their top-left
 * corner, so every result is shifted by half the node's size.
 */
export function layoutGraph(
  nodes: LayoutNode[],
  edges: LayoutEdge[]
): LayoutPositions {
  const graph = new dagre.graphlib.Graph();
  graph.setGraph({
    rankdir: 'TB',
    nodesep: NODE_SEPARATION,
    ranksep: RANK_SEPARATION
  });
  graph.setDefaultEdgeLabel(() => ({}));

  const known = new Set(nodes.map((node) => node.id));
  for (const node of nodes) {
    graph.setNode(node.id, { width: node.width, height: node.height });
  }
  for (const edge of edges) {
    if (known.has(edge.source) && known.has(edge.target)) {
      graph.setEdge(edge.source, edge.target);
    }
  }

  dagre.layout(graph);

  const positions: LayoutPositions = {};
  for (const node of nodes) {
    const laidOut = graph.node(node.id);
    positions[node.id] = {
      x: laidOut.x - node.width / 2,
      y: laidOut.y - node.height / 2
    };
  }
  return positions;
}
