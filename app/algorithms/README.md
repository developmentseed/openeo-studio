# Algorithms

This directory holds the Python code that openEO Studio runs in the browser with Pyodide, and the sample
algorithms.

## Structure

```text
algorithms/
├── base/
│   ├── processes.py           # Exposes the openEO process functions (op.<name>)
│   ├── loader.py              # Parameters and input datacube (deployments can replace it)
│   ├── openeo-processes.json  # Generated: process names for the linter (pnpm processes:generate)
│   └── environment.ts         # The code contract for the linter and the Code tab panel
├── visualizations/            # Sample algorithms (see app/config/sample-scenes.ts)
└── indices/
```

## The code contract

`app/utils/code-runner.ts` runs these parts in this order, in one Python namespace:

1. `RUN_CONFIG = {...}`: the values of the `Configuration` tab.
2. `base/processes.py`
3. `base/loader.py`
4. The user code.
5. `json.dumps(map_graphs)`: the result that openEO Studio reads.

The user code can use these names without an import:

| Name | Description |
| --- | --- |
| `reduced` | The datacube with the first pixel in time selected. |
| `datacube` | The collection loaded with the `Configuration` values. |
| `add_graph_to_map(graph, name)` | Adds a result to the map. The user code must call it at least once. |
| `op` | The module `openeo.processes`. Write processes as `op.<name>`. |
| `bounding_box` | `Parameter`, default `dict` `{west, south, east, north}`. |
| `time` | `Parameter`, default `list[str]` `[start, end]`. |
| `bands` | `Parameter`, default `list[str]` of band names. |
| `cloud_cover_max` | `Parameter`, default `number` (percent). |

The user documentation is in `app/pages/docs/docs-content.md`, section "Python environment (code contract)".

### Process names

- Recommended: `op.<name>`, for example `op.if_`, `op.clip`, `op.max`.
- For compatibility, `processes.py` also exposes every process as a bare name. A name that clashes with a Python
  built-in gets a trailing underscore: `max_`, `min_`, `sum_`, `round_`, `int_`, `all_`, `any_`. The Python
  built-ins do not work on openEO graph objects.

### Keep the contract in sync

The Python files are the source. `base/environment.ts` describes them for the linter (`app/utils/ruff-linter.ts`)
and the Code tab panel. `test/algorithms/environment.test.ts` fails when they drift apart.

- When you add a top-level name to `processes.py` or `loader.py`, add it to `LOADER_GLOBALS`.
- When you change the `openeo` version pin in `app/stores/pyodide-store.ts`, run `pnpm processes:generate` with the
  same client version.

## Adding a sample algorithm

1. Add a `.py` file in `visualizations/`. Start from `reduced` and end with `add_graph_to_map(...)`:

   ```python
   def visualize(data):
       red, nir = data[0], data[1]
       ndvi = (nir - red) / (nir + red)
       return op.array_create([ndvi, ndvi, ndvi])

   result = reduced.apply_dimension(dimension="bands", process=visualize)
   result = result.linear_scale_range(input_min=-1, input_max=1, output_min=0, output_max=255)
   add_graph_to_map(result.save_result("PNG"), "NDVI")
   ```

2. Add the scene to `app/config/sample-scenes.ts`, with the bands in the order that the code reads them.

Note: `visualizations/false-color.py` and `indices/ndvi.py` are not samples. They still use an old contract
(`dimension="spectral"`, `to_json()`).
