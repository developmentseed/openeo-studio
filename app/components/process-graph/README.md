# Process graph viewer

Read-only node/edge rendering of an openEO process graph for the map panel's
**Visual** tab. Nodes can be dragged, panned, and zoomed; connections and
argument values cannot be changed. Nested callback graphs are reached by
drill-down navigation.

This was mostly developed by an AI agent based on [ModelBuilder from openeo-vue-components](https://github.com/Open-EO/openeo-vue-components/blob/master/components/ModelBuilder.vue). Specs are in
[`docs/superpowers/specs/2026-08-03-visual-process-graph-tab-design.md`](../../../docs/superpowers/specs/2026-08-03-visual-process-graph-tab-design.md).

- [Process graph viewer](#process-graph-viewer)
  - [Folder layout](#folder-layout)
  - [The two libraries](#the-two-libraries)
    - [React Flow (`@xyflow/react`) — the canvas](#react-flow-xyflowreact--the-canvas)
    - [Dagre (`@dagrejs/dagre`) — the layout](#dagre-dagrejsdagre--the-layout)
    - [How they meet in this folder](#how-they-meet-in-this-folder)
  - [Information flow](#information-flow)
  - [Lifecycle](#lifecycle)
    - [Mount / new graph](#mount--new-graph)
    - [Drill-down](#drill-down)
    - [Drag / pan / zoom](#drag--pan--zoom)
    - [Reset layout](#reset-layout)
  - [Modules](#modules)
    - [format-value.ts](#format-valuets)
    - [graph-model.ts](#graph-modelts)
    - [layout.ts](#layoutts)
    - [process-node.tsx](#process-nodetsx)
    - [graph-breadcrumb.tsx](#graph-breadcrumbtsx)
    - [process-graph-viewer.tsx](#process-graph-viewertsx)


## Folder layout

| File | Role |
| --- | --- |
| `index.ts` | Public surface. Named + default export of `ProcessGraphViewer` (default is required by `React.lazy`). |
| `process-graph-viewer.tsx` | Canvas: React Flow wiring, layout pass, drill-down state, position cache. |
| `process-node.tsx` | Custom React Flow node type `'process'`. Title bar, argument rows, handles, popover. |
| `graph-breadcrumb.tsx` | Absolute top-left breadcrumb while drilled into a subgraph. |
| `graph-model.ts` | Pure: `ProcessGraph` → `{ nodes, edges }` view model. No React Flow imports. |
| `layout.ts` | Pure: dagre top-to-bottom layout. Centre → top-left conversion for React Flow. |
| `format-value.ts` | Pure: argument value → `display` + optional `full` / `glyph`. |

Unit tests live in `test/components/process-graph-*.test.ts` (model, layout,
format only — components are covered by Playwright).

## The two libraries

### React Flow (`@xyflow/react`) — the canvas

A React component that draws an interactive diagram from two arrays you own:

```ts
nodes: [{ id, type, position: { x, y }, data }, …]
edges: [{ id, source, target, sourceHandle?, targetHandle? }, …]
```

What it gives us for free:

- **Pan / zoom** of the viewport (mouse wheel, drag background).
- **Node dragging** — updates `position` via `onNodesChange`; we store that in
  `useNodesState`.
- **Edges** drawn between named **handles** (the small connection dots). Our
  custom node puts target handles on top (one per wired argument) and a source
  handle `output` on the bottom of every non-result node. Result nodes omit
  the source handle — nothing downstream should connect from them.
- **Custom node types** — `nodeTypes={{ process: ProcessNode }}` means every
  node with `type: 'process'` is rendered by our Chakra component, not the
  default box.
- **Measurement** — after paint it knows each node's pixel size
  (`node.measured`) so layout and `fitView` can use real heights.
- **Controls / Background / fitView** — zoom buttons, dotted grid, camera fit.

What it does *not* do: decide where nodes should sit. If every node starts at
`{0,0}` they stack on top of each other until dagre assigns positions.

Mental model:

```
you own nodes[] + edges[]  ──react──►  React Flow paints them
         ▲                                    │
         │         onNodesChange (drags)      │ measured sizes
         └────────────────────────────────────┘
```

Editing the nodes is disabled. They can only be dragged.

### Dagre (`@dagrejs/dagre`) — the layout

A pure layout algorithm without React or DOM. You hand it a graph with node sizes
and edges and it returns coordinates.

```ts
// what we pass in
nodes: [{ id, width, height }, …]   // height from React Flow's measured DOM
edges: [{ source, target }, …]

// what we get back
{ [id]: { x, y }, … }
```

How it works:

1. Treat the graph as a DAG (directed acyclic graph).
2. Assign each node a **rank** (a row) so edges mostly point downward
   (`rankdir: 'TB'`).
3. Order nodes within a rank to reduce edge crossings.
4. Place them with gaps: `nodesep` (horizontal, 24px) and `ranksep`
   (vertical, 48px).

Dagre runs once per path depth, after React Flow has measured the nodes. It
does not run on every drag — dragged positions stay until "Reset layout" or a
new graph arrives.

### How they meet in this folder

```
buildGraphView()          who the nodes/edges are (openEO → view model)
        │
        ▼
React Flow                render custom nodes, measure heights, handle drag/pan
        │
        ▼  measured width/height
layoutGraph() / dagre     assign {x,y}
        │
        ▼
React Flow again          paint at those positions, fitView
```

`graph-model.ts` and `layout.ts` stay free of React Flow so Jest can unit-test
them. Only `process-graph-viewer.tsx` and `process-node.tsx` import
`@xyflow/react`.

## Information flow

```
useEditorStore().services
        │
        ▼
useMergedProcessGraph()          mergeProcessGraphs, or null
        │
        ▼
ProcessGraphViewer({ graph })
        │
        ├─ path: GraphPathEntry[]     drill-down stack (empty = root)
        │
        ▼
currentGraph = path.at(-1)?.graph ?? graph
        │
        ▼
buildGraphView(currentGraph)     GraphView { nodes, edges }
        │
        ├─ formatArgumentValue()     per-argument display / full
        ├─ findSubgraph()            nested process_graph → SubgraphRef
        └─ collectNodeRefs()         from_node → edges
        │
        ▼
React Flow nodes + edges
        │
        ▼  (once measured)
layoutGraph(measuredSizes, edges)
        │
        ▼
positions written into nodes; fitView()
```

## Lifecycle

### Mount / new graph

1. `results-panel` passes the merged graph into `<ProcessGraphViewer graph={…} />`
   (or shows the empty state when the hook returns `null`).
2. `ProcessGraphViewer` wraps `Canvas` in `ReactFlowProvider`.
3. `Canvas` resets `path` and the position cache whenever `graph` identity
   changes (a fresh Save run).
4. `buildGraphView(currentGraph)` produces the view model.
5. Nodes are seeded at `{x:0,y:0}` (or restored from the position cache if this
   depth has been visited before) and handed to `useNodesState`.
6. React Flow renders them and measures DOM sizes into its own store.
7. The layout effect waits until local `nodes` and `getNodes()` both match
   `view.nodes` **and** every store node has `measured` dimensions (rAF-poll
   if needed — see pitfall below). Only then it runs dagre, writes positions,
   caches them under the current path key, and calls
   `fitView({ padding: 0.15, maxZoom: 1 })`.

### Drill-down

1. A subgraph argument row renders a `⤢ N node(s)` pill.
2. Click → `onOpenSubgraph` → push `{ nodeId, argPath, graph }` onto `path`.
3. `currentGraph` switches; steps 4–7 rerun for the subgraph. The layout effect
   intentionally skips the first commit after the switch, when the store still
   holds the previous level.
4. `GraphBreadcrumb` appears. `onNavigate(0)` returns to the root;
   `onNavigate(k)` truncates to the first `k` entries.

### Drag / pan / zoom

- Dragging a node goes through React Flow's `onNodesChange` into local state.
  Positions are **not** written back to the cache until the next layout pass,
  so a tab switch away and back (with `lazyMount`) keeps the dragged positions
  via React state, while "Reset layout" / a new Save clears them.
- Pan and zoom are React Flow defaults. Connections, reconnects, and Delete are
  disabled (`nodesConnectable={false}`, `edgesReconnectable={false}`,
  `deleteKeyCode={null}`).

### Reset layout

The grid icon in `<Controls>` deletes the cache entry for the current path key
and clears `laidOutKey`, which re-triggers the layout effect.

## Modules

### `format-value.ts`

`formatArgumentValue(value, label): FormattedValue`

Returns `{ display, full?, glyph? }`. `glyph` is only set for boolean
literals (`'check' | 'cross'`); the node renders `LuCheck` / `LuX` and uses
`display` (`true` / `false`) for `aria-label`. Compact array elements still
stringify booleans as `true` / `false` because joined array text cannot host
React icons.

| Input | `display` | `full`? |
| --- | --- | --- |
| `true` / `false` | `true` / `false` (+ `glyph`) | no |
| number | stringified | no |
| `null` | `n/a` | no |
| short string | as-is | no |
| long string | truncated to budget | yes |
| array that fits | comma-joined compact forms | yes |
| array that overflows / empty | `List(n)` | yes |
| `{ from_parameter: n }` | `$n` | no |
| `{ from_node: n }` | `← n` | no |
| empty object | `None` | no |
| `{ west, south, east, north }` | `Bounding Box` | yes |
| GeoJSON | its `type` | yes |
| object with `process_graph` | `Process` (safety net; model handles this first) | yes |
| anything else | `Object` | yes |

Budget: `max(24 - label.length, 8)`. Presence of `full` is what tells
`process-node` to attach a popover.

### `graph-model.ts`

`buildGraphView(graph): GraphView`

Walks each node once:

1. **Title.** `load_collection` with a string `id` becomes a collection node
   (`title` = collection id, `isCollection`, `id` argument omitted from rows).
   Everything else titles as `process_id`.
2. **Arguments.** Each argument is classified:
   - `subgraph` — `findSubgraph` found a nested `process_graph` (at the root or
     deeper, e.g. `properties["eo:cloud_cover"]`). `path` is the dotted path
     from the argument root; empty when the argument value *is* the holder.
   - `edge` — `collectNodeRefs` found one or more `{from_node}` references.
     A whole-value reference (`{from_node: n}`) gets empty `display` (the edge
     already says it). Nested refs inside arrays/objects still render `← n`.
   - `parameter-ref` — whole-value `{from_parameter: n}`.
   - `literal` — everything else, formatted via `formatArgumentValue`
     (including `glyph` for booleans).
3. **Edges.** One edge per `(source, target, targetHandle)`. Labelled with the
   argument name only when the target has more than one wired argument.
   References into nested subgraphs are not followed (`collectNodeRefs` stops
   at `process_graph`). Missing source ids are skipped.

Internal helpers: `collectNodeRefs`, `findSubgraph`, `buildArgument`,
`isWholeValueNodeRef`, `isParameterRef`.

### `layout.ts`

`layoutGraph(nodes, edges): LayoutPositions`

- Fixed width `NODE_WIDTH = 220`; height comes from measured DOM.
- `rankdir: 'TB'`, `nodesep: 24`, `ranksep: 48`.
- Dagre centres → subtract half width/height for React Flow's top-left origin.
- Edges whose endpoints are not in `nodes` are ignored.

### `process-node.tsx`

Custom node registered as `NODE_TYPES = { process: ProcessNode }`.

- Target handles on `Position.Top`, one per wired argument, spaced evenly.
- Source handle `output` on `Position.Bottom` only when `!isResult`. Result
  nodes have no bottom handle.
- Border colour: selected → `primary.solid`; collection → `primary.emphasized`;
  result → `success.solid`; else `border.emphasized`.
- Collection header uses `primary.subtle`; others `bg.emphasized`.
- Subgraph rows render the pill (`className='nodrag'` so clicks don't drag).
- Rows with `glyph` render `LuCheck` / `LuX`; rows with `full` use
  `ExpandableValue` (Chakra popover, portal'd); otherwise plain `display` text.
- Optional `description` renders muted under the argument rows.
- Footer shows `Result` or `output`.

`ProcessNodeData` intersects `Record<string, unknown>` to satisfy React Flow
12's node-data constraint.

### `graph-breadcrumb.tsx`

Renders nothing when `path` is empty. Otherwise:

```
Graph › #ad1 · process › #ae1 · …
```

### `process-graph-viewer.tsx`

State:

| State | Meaning |
| --- | --- |
| `path` | Drill-down stack. |
| `positionCache` | `Map<pathKey, Record<nodeId, {x,y}>>`, session-scoped via `useRef`. |
| `laidOutKey` | Path key already laid out; `null` means "needs layout". |
| `nodes` / `onNodesChange` | React Flow local node state (positions after drag). |

`pathKey` joins `nodeId:argPath` segments with `/`. Empty path → `''` (root).

Controls (zoom / fit / reset) are React Flow's `<Controls>` plus a
`ControlButton`. Sizing and radius are overridden with Chakra `css` on the
viewer wrapper targeting `.react-flow__controls` / `-button`. Theme colours
still come from React Flow's `colorMode` + `--xy-controls-*` variables.

## Pitfalls

**Layout must wait for the current level's measured nodes — both which and
when.** Dimensions come from `getNodes()`, not the `useNodesState` array alone:
measurements live in React Flow's store first.

`useNodesInitialized()` can also stay `true` across a drill-down for one
commit while `getNodes()` still holds the previous level. Laying out then
caches wrong ids under the new path key and sets `laidOutKey`, which blocks
the real pass; re-entering that level keeps reading the bad cache. "Reset
layout" clears both, which is why it appeared to fix it. The layout effect
therefore:

1. Bails until local `nodes` ids match `view.nodes` (skips the stale commit).
2. rAF-polls until `getNodes()` ids match and every node has `measured`.
3. Only then runs dagre, writes the cache, and sets `laidOutKey`.

**`fitView` is capped at `maxZoom: 1`.** Without it, a one-node callback graph
zooms to fill the canvas.

**`NODE_TYPES` is module-scoped.** Recreating the object each render makes
React Flow remount every node.

**Popover / pill clicks need `className='nodrag'`.** Otherwise React Flow
treats the mousedown as a drag start.
