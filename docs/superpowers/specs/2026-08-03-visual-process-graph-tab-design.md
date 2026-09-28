# Visual tab: read-only process graph viewer

Date: 2026-08-03
Status: approved, ready for implementation planning

## Context

The map panel has a `Map | Visual | JSON` tab list, but `Visual` has a
`Tabs.Trigger` with no matching `Tabs.Content` — clicking it shows an empty
panel. This spec covers filling it with a read-only node/edge rendering of the
openEO process graph.

The reference implementation is [ModelBuilder.vue][mb] from
`Open-EO/openeo-vue-components`, a Vue 2 component built from three parts: a
container handling pan, zoom, selection and a naive left-to-right layout;
`Block.vue`, which renders absolutely-positioned HTML boxes listing each
argument as a row with a connector dot; and `Edge.vue`, which draws SVG lines
between those dots by reading their live DOM positions. Most of its ~1500 lines
are editing, undo history, clipboard, and schema validation.

We reimplement the parts worth keeping — the block anatomy and visual grammar —
and drop the editing machinery and the DOM-measurement layer.

[mb]: https://github.com/Open-EO/openeo-vue-components/blob/master/components/ModelBuilder.vue

### Data already available

`useEditorStore().services` is a `ServiceInfo[]`, each carrying
`graphResult.process_graph` (an openEO flat graph) plus `graphResult.parameters`.
The JSON tab already combines them with `mergeProcessGraphs()` from
`app/utils/openeo/user-defined-processes.ts`. Types for the whole openEO process model live in
`app/types/openeo-process.ts`. No graph library is installed, and nothing in the
app calls `GET /processes`.

### Shape of real graphs

`app/algorithms/base/loader.py` builds a `load_collection` node whose
`properties` argument contains a nested process graph at
`properties["eo:cloud_cover"].process_graph`. Algorithms such as
`cloud-detection.py` call `apply_dimension(process=...)`, which compiles the
entire Python callback into a nested graph of several dozen `if_` / `clip` /
`and_` nodes under the `process` argument. Nested subgraphs are therefore the
norm, not an edge case, and they hold most of the interesting logic.

`Parameter` objects declared in the loader (`bounding_box`, `time`, `bands`,
`cloud_cover_max`) appear in arguments as `{"from_parameter": "bands"}`.

## Goals

- Render the merged process graph as a draggable, pannable, zoomable diagram.
- Make nested callback subgraphs reachable and readable.
- Match ModelBuilder's visual grammar closely enough to be familiar to openEO
  users, while fitting the app's Chakra theme and dark mode.
- Keep the code in one folder with clear module boundaries.

## Non-goals

- Any mutation of the graph: no adding, deleting, connecting, reconnecting, or
  editing values. Node dragging is the only permitted manipulation.
- Undo/redo, clipboard, multi-select, or selection-driven actions.
- Schema validation or type-compatibility checking between nodes.
- Fetching process metadata from the backend (see "Decisions", item 5).
- Persisting node positions across page reloads.

## Decisions

1. **Render the merged graph**, the same value the JSON tab shows. Shared nodes
   are deduplicated by `mergeProcessGraphs()`, so branching between layers is
   visible in one canvas.

2. **Nested subgraphs use drill-down navigation**, not inline expansion or
   collapse-only. An argument holding a subgraph renders as a pill showing the
   node count; clicking it replaces the canvas with that subgraph and pushes a
   breadcrumb entry. Inline expansion was rejected because nesting goes several
   levels deep and edge routing in and out of group containers is
   disproportionately complex. Collapse-only (ModelBuilder's behaviour) was
   rejected because it makes the cloud-detection logic unreachable.

3. **React Flow (`@xyflow/react`) with `@dagrejs/dagre` for layout.** Node
   dragging, pan, zoom, and fit-to-view are requirements, and hand-writing drag
   state, hit testing, and edge re-measurement is the bulk of ModelBuilder's
   remaining complexity. Handle-anchored edges also remove the
   measure-then-draw coupling that forces ModelBuilder's `getCirclePosition`,
   `refreshEdges`, and `$nextTick` calls. Cost is roughly 75kb gzipped, mitigated
   by lazy loading. ADR-0002 (avoid dependencies) is already superseded by
   ADR-0003, which adopted Zustand on the same reasoning.

4. **Parameter references render inline** as `$bands`, rather than as separate
   parameter nodes the way ModelBuilder does. This keeps the node count down and
   avoids having to model callback-scoped parameters (`value`, `data`) that only
   exist inside a subgraph.

5. **No `GET /processes` call.** The tab renders purely from the graph JSON, so
   it works offline and adds no request. The consequence is that the viewer shows
   only bound arguments, has no process summaries or descriptions, and cannot
   flag an unknown `process_id` as invalid. Process metadata can be layered on
   later behind the same node view model without reshaping anything.

6. **Top-to-bottom layout.** The map panel is `calc(100vh - 1rem)` tall and about
   half the viewport wide at the default split, narrowing to 20%. A left-to-right
   pipeline of five 220px blocks runs ~1400px wide and would need constant
   panning or an unreadable zoom level. Top-to-bottom fits at 100% zoom and reads
   like the Python script that produced it.

7. **Truncated values open a popover, not an inspector panel.** With decisions 4
   and 5 in place, the only information a side panel could add is the untruncated
   value of arguments the node abbreviates (`Bounding Box`, `List(3)`, and
   nested objects). A popover anchored to the argument row solves exactly that at
   no layout cost, and unlike ModelBuilder's `title` tooltips it works on touch.

8. **Dragged positions survive tab switches but not graph changes.** They live in
   component state, are cached per drill-down path, and reset when the merged
   graph changes or the user presses "Reset layout".

## Architecture

### Folder

All new code lives in `app/components/process-graph/`:

| File | Responsibility |
| --- | --- |
| `index.ts` | Public surface: re-exports `ProcessGraphViewer`. |
| `process-graph-viewer.tsx` | Orchestrator. Owns the React Flow canvas, drill-down state, position cache, and chrome. |
| `graph-model.ts` | Pure. `ProcessGraph` to React Flow nodes and edges; subgraph discovery. |
| `layout.ts` | Pure. Runs dagre over measured node dimensions. |
| `format-value.ts` | Pure. Argument value to display string plus full JSON. |
| `process-node.tsx` | The custom React Flow node: title bar, argument rows, handles, value popover. |
| `graph-breadcrumb.tsx` | Drill-down trail. |

### Changes outside the folder

- `app/components/editor/results-panel.tsx` gains a `<Tabs.Content value='visual'>`
  rendering the viewer, and `lazyMount` on its `Tabs.Root`.
- The merged-graph computation currently inlined in `OutputJson` moves to a
  `useMergedProcessGraph()` hook (in `app/components/layout/`) that reads
  `services` from the store and returns `ProcessGraph | null`, returning `null`
  when there are no services or the merge throws. Both the JSON and Visual tabs
  call it.
- `ProcessGraphViewer` is imported via `React.lazy` and wrapped in `Suspense`
  with a Chakra `Spinner` fallback, keeping xyflow and dagre out of the initial
  bundle. Combined with `lazyMount`, the module loads the first time the Visual
  tab is activated and the component then stays mounted, which is what preserves
  drag positions across tab switches. `defaultValue` remains `map`, so nothing
  user-visible changes for the other tabs.

### View model

`graph-model.ts` exports these types and one entry point.

```ts
type ArgumentKind = 'edge' | 'parameter-ref' | 'subgraph' | 'literal';

interface ArgumentView {
  name: string;
  kind: ArgumentKind;
  /** Abbreviated, ready to render. */
  display: string;
  /** Pretty-printed full value. Present only when `display` abbreviates it. */
  full?: string;
  /** Boolean literals; the node renders LuCheck / LuX instead of text. */
  glyph?: 'check' | 'cross';
  /** True when at least one edge terminates on this argument. */
  wired: boolean;
  /** Present when kind === 'subgraph'. */
  subgraph?: { graph: ProcessGraph; path: string; nodeCount: number };
}

interface ProcessNodeView {
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

function buildGraphView(graph: ProcessGraph): {
  nodes: Node<ProcessNodeView>[];
  edges: Edge[];
};
```

Rules:

- **Edges.** Walk every argument value collecting `{from_node: id}` references.
  Do not descend into a value containing a `process_graph` key — those
  references point at siblings inside that subgraph, the same rule
  `renameNodeReferences` in `app/utils/openeo/user-defined-processes.ts` already applies. One
  argument can yield multiple edges (`array_create` receiving a list of
  references). Each edge is `{source: refId, sourceHandle: 'output', target:
  nodeId, targetHandle: argName}`.
- **Subgraph discovery.** Search each argument value recursively for objects
  with a `process_graph` key, recording the dotted JSON path from the argument
  root. ModelBuilder only checks the argument's top level, which is why it
  cannot see `load_collection.properties["eo:cloud_cover"].process_graph`;
  recursing fixes that. `path` is the breadcrumb label suffix, for example
  `properties.eo:cloud_cover`.
- **Collection title.** When `process_id === 'load_collection'` and
  `arguments.id` is a plain string rather than a reference, the node title
  becomes that collection id and the `id` argument row is omitted, since it
  would be redundant with the title. This matches ModelBuilder.
- **Result node.** `result === true` uses `success.solid` borders, labels its
  footer "Result" instead of "output", and omits the bottom source handle —
  nothing should connect downstream from a result.
- **Argument order** is the insertion order of the `arguments` object, which is
  the order the openEO Python client emitted them.

### Value formatting

`format-value.ts` ports `BlockParameter.vue`'s rules, which are sensible and
worth keeping. `formatArgumentValue(value, label)` returns
`{display, full?, glyph?}`. Booleans set `glyph: 'check' | 'cross'`; the node
renders `LuCheck` / `LuX` (`react-icons/lu` has no `LuXmark` in our version)
and keeps `display` as `true` / `false` for accessibility. Compact forms inside
joined arrays still use the text `true` / `false`.

| Input | `display` |
| --- | --- |
| `boolean` | `true` / `false` (+ `glyph` → Lucide icon in the node) |
| `number` | `String(value)` |
| `string` | verbatim, or truncated with an ellipsis past the budget |
| `null` | `n/a` |
| `{}` | `None` |
| array | elements joined with `, ` until the budget is exceeded, then `List(n)` |
| `{west, south, east, north}` | `Bounding Box` |
| GeoJSON object | its `type` |
| `{from_parameter: n}` | `$n` |
| `{from_node: n}` nested in an array or object | `← n` |
| anything with `process_graph` | handled as a subgraph pill, not here |
| other object | `Object` |

An argument whose entire value is a single `{from_node: n}` renders an empty
`display`: the incoming edge already carries that information, and repeating it
in the row is noise. References nested inside an array or object still render
`← n`, because there the edge alone cannot say which element it feeds.

The character budget is `max(24 - label.length, 8)` — tighter than ModelBuilder's
`38` so values fit the fixed 220px node width. `full` is set to
`JSON.stringify(value, null, 2)` whenever `display` does not round-trip the
value — that is, for every case above except booleans, numbers, untruncated
strings, and `null`. A row only gets a popover when `full` is present.

### Node rendering and handles

`process-node.tsx` renders a title bar (process name, dimmed node id, namespace
when present) followed by one row per argument and an output row. When the node
carries a `description`, it renders as a muted, wrapped line beneath the
argument rows. The openEO API allows this field per node; the current loader
never sets it, so in practice it is usually absent.

Handles, given the top-to-bottom flow:

- One source handle, `Position.Bottom`, centred, `id: 'output'`, on every
  **non-result** node. Result nodes omit it.
- One target handle per **wired** argument on `Position.Top`, `id` set to the
  argument name, distributed evenly across the top edge in argument order.
  Unwired arguments get no handle.

Putting target handles on the left edge at each row's height would preserve
ModelBuilder's exact grammar, but in a vertical layout every edge would hook
around the side of the block. Top-edge handles keep the flow clean. To retain
the information that placement loses, each wired argument row renders a small
filled dot before its label, and edges carry a label naming the target argument
**only when the target node has more than one wired argument** — for the common
single-input case (`data`) the label would be noise.

Edge type is `smoothstep`.

### Layout

`layout.ts` exports `layoutGraph(nodes, edges)` running dagre with
`rankdir: 'TB'`, `nodesep: 24`, `ranksep: 48`.

Node dimensions are **measured, not estimated**. React Flow v12 populates
`node.measured.width/height` after the first render. The viewer waits until
local nodes and `getNodes()` both match the current view **and** every store
node is measured (including across drill-down, where the previous level can
linger for one commit), then runs dagre and `fitView`. This avoids
ModelBuilder's `MARGIN + inputs * 15` size guess and the spacing errors it
produces. Node width is fixed at 220px (ModelBuilder's `normalParams`) so only
height varies.

### Interaction

| React Flow prop | Value | Reason |
| --- | --- | --- |
| `nodesDraggable` | `true` | Required. |
| `nodesConnectable` | `false` | No edge creation. |
| `edgesReconnectable` | `false` | No edge rewiring. |
| `elementsSelectable` | `true` | Enables the selected-node focus ring. |
| `deleteKeyCode` | `null` | No deletion. |
| `multiSelectionKeyCode` | `null` | No multi-select. |
| `colorMode` | from `useColorMode()` | Follows the app's light/dark setting. |

### Drill-down

Navigation state is `Array<{nodeId: string; argPath: string; label: string}>`.
An empty array is the merged root graph; each entry descends one level. The
current graph is resolved by walking the path from the root.

Node positions are cached in a `Map` keyed by the serialised path, so returning
to a level restores the arrangement the user left. The whole cache clears when
the merged graph changes.

`graph-breadcrumb.tsx` renders the trail top-left using Chakra's `Breadcrumb`,
with the root labelled "Graph" and each level labelled
`#{nodeId} · {argPath}`. It renders nothing when the path is empty.

### Chrome

- `<Background variant='dots' />`.
- Custom `<Controls>` at top-right with Lucide icons (`LuPlus`, `LuMinus`,
  `LuMaximize2`, `LuLayoutGrid`). Default React Flow buttons are hidden;
  zoom in/out honour `minZoom` / `maxZoom`. Reset layout clears the cached
  positions for the current level and re-runs dagre. Button size and control
  radius are tuned via Chakra `css` on the viewer wrapper.
- No minimap. The panel is too narrow to give up a corner, and the top-right is
  already occupied by the floating `Map | Visual | JSON` tab list at
  `top:4 right:4 zIndex:9999`.

### Styling

Colours follow ModelBuilder's grammar — collection nodes tinted blue, the
result node in success emphasis, subgraph pills in the accent colour — but are
expressed with Chakra semantic tokens from `app/styles/theme.ts` rather than
ModelBuilder's hardcoded hexes, so dark mode works. React Flow's
`--xy-controls-*` variables and `colorMode` keep the control chrome in sync.

### Empty and error states

When `useMergedProcessGraph()` returns `null` — no services, or the merge threw
— the tab renders a centred icon and the text "There is no output to display."
followed by "Run your code to see the process graph." This mirrors the JSON
tab's structure. The wording differs deliberately: services appear on Apply, not
on save, so the JSON tab's existing "Save your project to see the process graph"
is inaccurate. That is left unchanged, as it is out of scope here.

A malformed graph never crashes the panel; the merge failure path already
degrades to the empty state.

## Testing

Unit tests (Jest, in `test/components/`) cover the pure modules:

- `graph-model.ts` — edges from directly-referenced and array-nested
  `from_node` values; no edges emitted from inside a nested `process_graph`;
  subgraph discovery at the argument root and at
  `properties["eo:cloud_cover"]`; the `load_collection` title override and
  omission of the `id` row; the result-node flag; `wired` set only on arguments
  that receive an edge.
- `format-value.ts` — one case per row of the formatting table (including
  boolean `glyph`), plus the truncation boundary and the rule governing when
  `full` is populated.
- `layout.ts` — TB stacking, centre→top-left conversion, disconnected nodes,
  missing endpoints ignored.

An integration test (Playwright, in `test/integration/visual-tab.spec.ts`)
stubs Pyodide and the openEO API, opens the Visual tab, asserts nodes render,
clicks a subgraph pill, and asserts the breadcrumb appears and the canvas
changes.

In development builds only, `/sandbox/visual-graph` hosts a static kitchen-sink
graph (`app/pages/sandbox/`) covering every argument kind and two nesting
levels. The route is not registered in production.

## Dependencies

- `@xyflow/react` ^12.11
- `@dagrejs/dagre` ^3.1

Both MIT licensed. Roughly 75kb gzipped combined, loaded lazily on first
activation of the Visual tab.
