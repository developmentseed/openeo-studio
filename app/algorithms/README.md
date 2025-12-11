# Algorithms Directory

This directory contains Python scripts for processing Sentinel-2 satellite imagery using OpenEO.

## Structure

```
algorithms/
├── base/
│   └── loader.py          # Base data loader for Sentinel-2 L2A imagery
├── visualizations/
│   ├── true-color.py      # Natural RGB color visualization
│   └── false-color.py     # Infrared false color (vegetation emphasis)
├── indices/
│   └── ndvi.py            # Normalized Difference Vegetation Index
└── README.md
```

## How It Works

The Python scripts are modular and composed at runtime:

1. **Base Loader** (`base/loader.py`):
   - Loads Sentinel-2 data from S3/Zarr
   - Defines spatial extent parameters
   - Extracts all spectral bands (B02-B12)
   - Creates the base `datacube` object

2. **Algorithm Scripts**:
   - Define visualization or analysis functions
   - Process the `datacube` object from the loader
   - Return processed results

3. **Composition**:
   - The TypeScript code runner (`app/utils/code-runner.ts`) combines:
     ```python
     # loader.py content
     # +
     # algorithm.py content
     ```
   - This creates a complete executable Python program

## Available Bands

- `B02`: Blue (10m)
- `B03`: Green (10m)
- `B04`: Red (10m)
- `B05`: Red Edge 1 (20m)
- `B07`: Red Edge 3 (20m)
- `B08`: NIR (10m)
- `B8A`: Narrow NIR (20m)
- `B11`: SWIR 1 (20m)
- `B12`: SWIR 2 (20m)

## Creating New Algorithms

To create a new algorithm:

1. Create a new `.py` file in the appropriate subdirectory:
   - `visualizations/` for color composites
   - `indices/` for vegetation/water/other indices
   - Create new subdirectories as needed

2. Your script has access to:
   - `datacube`: The OpenEO DataCube object
   - All band variables (`B02`, `B03`, etc.)
   - OpenEO functions: `array_create`, `if_`, `absolute`, `and_`

3. Your script should:
   - Define a processing function (optional)
   - Apply transformations to `datacube`
   - Call `save_result()` with desired format
   - End with `to_json()` to return the graph

4. Example template:

   ```python
   """
   My Custom Algorithm
   Description of what it does.
   """

   def my_process(data):
       # Your processing logic
       return result

   map_viz = datacube.apply_dimension(dimension="spectral", process=my_process)
   map_viz = map_viz.linear_scale_range(
       input_min=0, input_max=1, output_min=0, output_max=255
   )
   map_viz = map_viz.save_result("PNG")
   map_viz.to_json()
   ```

5. Import in TypeScript:
   ```typescript
   import myAlgorithm from '../algorithms/category/my-algorithm.py?raw';
   ```

## Notes

- All `.py` files are loaded as raw text using Vite's `?raw` import suffix
- The loader script is automatically prepended to algorithm scripts
- Python code is executed in the browser using Pyodide
- The final output is an OpenEO process graph in JSON format
