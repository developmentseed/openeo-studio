import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { LuLayoutGrid } from 'react-icons/lu';
import {
  Background,
  BackgroundVariant,
  ControlButton,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useReactFlow,
  type Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import type { ProcessGraph } from '$types/openeo-process';
import { useColorMode } from '$utils/color-mode';

import { buildGraphView, type ArgumentView } from './graph-model';
import { NODE_WIDTH, layoutGraph } from './layout';
import {
  NODE_TYPES,
  type ProcessNodeData,
  type ProcessNodeType
} from './process-node';
import { GraphBreadcrumb, type GraphPathEntry } from './graph-breadcrumb';

/** Height used before a node has been measured; replaced on the first layout. */
const ESTIMATED_NODE_HEIGHT = 80;

/** Capped so a single-node callback graph does not fill the whole canvas. */
const FIT_VIEW_OPTIONS = { padding: 0.15, maxZoom: 1 };

type PositionCache = Map<string, Record<string, { x: number; y: number }>>;

function pathKey(path: GraphPathEntry[]): string {
  return path.map((entry) => `${entry.nodeId}:${entry.argPath}`).join('/');
}

function sameNodeIds(
  left: readonly { id: string }[],
  right: readonly { id: string }[]
): boolean {
  if (left.length !== right.length) return false;
  const ids = new Set(left.map((node) => node.id));
  return right.every((node) => ids.has(node.id));
}

function Canvas({ graph }: { graph: ProcessGraph }) {
  const { colorMode } = useColorMode();
  const { fitView, getNodes } = useReactFlow();

  const [path, setPath] = useState<GraphPathEntry[]>([]);
  const positionCache = useRef<PositionCache>(new Map());

  // Reset navigation and cached positions whenever a new graph arrives.
  useEffect(() => {
    setPath([]);
    positionCache.current = new Map();
  }, [graph]);

  const currentGraph = path.length > 0 ? path[path.length - 1].graph : graph;
  const currentKey = pathKey(path);

  const openSubgraph = useCallback((nodeId: string, arg: ArgumentView) => {
    const subgraph = arg.subgraph;
    if (!subgraph) return;
    setPath((previous) => [
      ...previous,
      {
        nodeId,
        argPath: subgraph.path ? `${arg.name}.${subgraph.path}` : arg.name,
        graph: subgraph.graph
      }
    ]);
  }, []);

  const view = useMemo(() => buildGraphView(currentGraph), [currentGraph]);

  const initialNodes = useMemo<ProcessNodeType[]>(() => {
    const cached = positionCache.current.get(currentKey);
    return view.nodes.map((node) => ({
      id: node.id,
      type: 'process' as const,
      position: cached?.[node.id] ?? { x: 0, y: 0 },
      data: {
        ...node,
        onOpenSubgraph: (arg: ArgumentView) => openSubgraph(node.id, arg)
      } as ProcessNodeData
    }));
  }, [view, currentKey, openSubgraph]);

  const edges = useMemo<Edge[]>(
    () =>
      view.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        sourceHandle: 'output',
        target: edge.target,
        targetHandle: edge.targetHandle,
        label: edge.label,
        type: 'smoothstep'
      })),
    [view]
  );

  const [nodes, setNodes, onNodesChange] =
    useNodesState<ProcessNodeType>(initialNodes);
  const [laidOutKey, setLaidOutKey] = useState<string | null>(null);

  useEffect(() => {
    setNodes(initialNodes);
    const isCached = positionCache.current.has(currentKey);
    setLaidOutKey(isCached ? currentKey : null);
    if (isCached) {
      window.requestAnimationFrame(() => fitView(FIT_VIEW_OPTIONS));
    }
  }, [initialNodes, currentKey, setNodes, fitView]);

  // Lay out once per level, after React Flow has measured the *current*
  // level's nodes. On a path change, `useNodesInitialized()` can still be
  // true and `getNodes()` can still hold the previous level for one commit —
  // laying out then would cache wrong positions under the new path key and
  // block the real pass. Wait until local + store ids match the view, then
  // until every store node is measured (rAF), before writing the cache.
  useEffect(() => {
    if (laidOutKey === currentKey) return;
    if (!sameNodeIds(nodes, view.nodes)) return;

    let cancelled = false;
    let raf = 0;

    const attempt = () => {
      if (cancelled) return;

      const storeNodes = getNodes();
      if (!sameNodeIds(storeNodes, view.nodes)) {
        raf = window.requestAnimationFrame(attempt);
        return;
      }
      if (
        !storeNodes.every(
          (node) =>
            node.measured?.width != null && node.measured?.height != null
        )
      ) {
        raf = window.requestAnimationFrame(attempt);
        return;
      }

      const positions = layoutGraph(
        storeNodes.map((node) => ({
          id: node.id,
          width: node.measured?.width ?? NODE_WIDTH,
          height: node.measured?.height ?? ESTIMATED_NODE_HEIGHT
        })),
        view.edges
      );
      positionCache.current.set(currentKey, positions);

      setNodes((current) =>
        current.map((node) => ({
          ...node,
          position: positions[node.id] ?? node.position
        }))
      );

      setLaidOutKey(currentKey);
      window.requestAnimationFrame(() => fitView(FIT_VIEW_OPTIONS));
    };

    attempt();
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf);
    };
  }, [
    nodes,
    laidOutKey,
    currentKey,
    view.nodes,
    view.edges,
    setNodes,
    fitView,
    getNodes
  ]);

  const resetLayout = useCallback(() => {
    positionCache.current.delete(currentKey);
    setLaidOutKey(null);
  }, [currentKey]);

  const handleNavigate = useCallback((depth: number) => {
    setPath((previous) => previous.slice(0, depth));
  }, []);

  return (
    <Box
      position='relative'
      flexGrow={1}
      h='100%'
      css={{
        '& .react-flow__controls': {
          borderRadius: 'uni',
          overflow: 'hidden',
          m: 4,
          '& .react-flow__controls-button': {
            w: 9,
            h: 9
          },
          '& .react-flow__controls-button svg': {
            maxW: 4,
            maxH: 4
          }
        }
      }}
    >
      <ReactFlow<ProcessNodeType>
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        nodeTypes={NODE_TYPES}
        colorMode={colorMode}
        nodesDraggable
        nodesConnectable={false}
        edgesReconnectable={false}
        elementsSelectable
        deleteKeyCode={null}
        multiSelectionKeyCode={null}
        proOptions={{ hideAttribution: true }}
        minZoom={0.1}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <Controls showInteractive={false} position='bottom-left'>
          <ControlButton
            onClick={resetLayout}
            title='Reset layout'
            aria-label='Reset layout'
          >
            <LuLayoutGrid />
          </ControlButton>
        </Controls>
      </ReactFlow>
      <GraphBreadcrumb path={path} onNavigate={handleNavigate} />
    </Box>
  );
}

/**
 * Read-only viewer for an openEO process graph. Nodes can be dragged, panned,
 * and zoomed; nothing about the graph can be changed. Arguments holding a
 * nested process graph drill down into their own canvas.
 */
export function ProcessGraphViewer({ graph }: { graph: ProcessGraph }) {
  return (
    <ReactFlowProvider>
      <Canvas graph={graph} />
    </ReactFlowProvider>
  );
}
