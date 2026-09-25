
openEO Studio is a browser-based environment for data analysis with [openEO](https://openeo.org/) Python algorithms and immediate visual feedback. 
Compose openEO process [graphs](https://openeo.org/documentation/1.0/glossary.html) in Python using the [openEO Python client](https://open-eo.github.io/openeo-python-client/) and see results directly on a web map.


# How it works

1. Select from the data collections that are available in the connected Spatio-Temporal Asset Catalogue (STAC).
2. Write Python-like workflow code using [openEO Python client syntax](https://open-eo.github.io/openeo-python-client/basics.html).
3. openEO Studio runs your code in the browser with [Pyodide](https://pyodide.org/) (Python on [WebAssembly](https://webassembly.org/)), translating it into an openEO [process graph](https://openeo.org/documentation/1.0/glossary.html).
4. The process graph is registered in a [titiler-openeo](https://github.com/sentinel-hub/titiler-openeo) / [TiTiler](https://github.com/developmentseed/titiler) server that executes it tile-by-tile and sends back images of your processing result.

Please note: openEO Studio works best for synchronous workflows that produce a map layer within a few minutes. For large-scale batch processing, you'll need an openEO service with more compute resources and allowance.


# Simple example: RGB composite

This walk-through for true-color RGB (`B04`, `B03`, `B02`) was inspired by the [Manhattan notebook](https://github.com/sentinel-hub/titiler-openeo/blob/main/docs/src/notebooks/manhattan.ipynb).

### 1) Start from the landing page

On the [home screen](/), click `Start from Scratch` to open a blank editor session.

### 2) Configure the datacube

Set your input data first in the `Configuration` tab:

- Collection: [Sentinel-2](https://documentation.dataspace.copernicus.eu/Data/SentinelMissions/Sentinel2.html)
- Temporal range: choose the period you want to visualize
- Cloud cover: set a threshold for filtering
- Bands: select `red`, `green`, `blue` for true color (mind the order!)

openEO Studio’s base loader uses this configuration to create the input datacube and applies a generic bounding box for map exploration.

Band selection is central to openEO Studio workflows: the bands you choose define what is available for spectral band index formulas, RGB composites, and masking.

### 3) Insert algorithm code in the Code tab

In the `Code` tab, write only the visualization logic. The loader already provides:

- `datacube`: collection loaded from Configuration values
- `reduced`: datacube with first-pixel temporal selection already applied

Use this code:

```python
rgb = reduced.linear_scale_range( 
    input_min=0, input_max=0.4, output_min=0, output_max=255
)
map_viz = rgb.save_result("PNG")

add_graph_to_map(map_viz, "True Color")
```

Related processes: [`linear_scale_range`](https://processes.openeo.org/#linear_scale_range), [`save_result`](https://processes.openeo.org/#save_result).

### 4) Hit `Apply` and explore the result live on the map

Pan and zoom to inspect local detail. This is a very very simple workflow that loads the first time step of the datacube (`reduced`), applies a linear scaling for visualization enhancement, and outputs the result as PNG tiles.


# Example applications

### Ready-to-use workflow sources

- **Primary source**: [openeo-udp notebooks](https://github.com/developmentseed/openeo-udp)
- [Enhanced NDVI notebook](https://github.com/developmentseed/openeo-udp/blob/main/notebooks/sentinel/sentinel-2/remote_sensing_indices/ndvi_enhanced.ipynb)
- [NDCI cyanobacteria notebook](https://github.com/developmentseed/openeo-udp/blob/main/notebooks/sentinel/sentinel-2/marine_and_water_bodies/ndci_cyanobacteria.ipynb)
- [Cloud detection notebook](https://github.com/developmentseed/openeo-udp/blob/main/notebooks/sentinel/sentinel-2/cloud_detection/cohen_braaten_yang_cloud_detection.ipynb)
- [BAIS2 burned area notebook](https://github.com/developmentseed/openeo-udp/blob/main/notebooks/sentinel/sentinel-2/fire/bais2_burned_area.ipynb)
- [Sentinel Hub Custom Scripts library](https://custom-scripts.sentinel-hub.com/)

### Beginner

1. **True colour** (`B04`, `B03`, `B02`) using [Sentinel-2 band guidance](https://documentation.dataspace.copernicus.eu/Data/SentinelMissions/Sentinel2.html) and [True Color reference](https://custom-scripts.sentinel-hub.com/sentinel-2/true_color/)
2. **NDVI** for vegetation detection with [`ndvi`](https://processes.openeo.org/#ndvi)
3. **Temporal subset** with [`filter_temporal`](https://processes.openeo.org/#filter_temporal)
4. **AOI clipping** with [`filter_bbox`](https://processes.openeo.org/#filter_bbox) / [`filter_spatial`](https://processes.openeo.org/#filter_spatial)

### Intermediate

1. **Cloud-masked composite** with [SCL](https://sentinels.copernicus.eu/web/sentinel/technical-guides/sentinel-2-msi/level-2a/algorithm-overview), [`mask`](https://processes.openeo.org/#mask), and temporal [`reduce_dimension`](https://processes.openeo.org/#reduce_dimension)
2. **Water detection (NDWI)** from `B03`/`B08` ([NDWI background](https://en.wikipedia.org/wiki/Normalized_difference_water_index))
3. **Change detection** between periods with temporal reducers
4. **Custom band math** with [spectral index cookbook patterns](https://open-eo.github.io/openeo-python-client/cookbook/spectral_indices.html)


# FAQ / Troubleshooting

### Empty map

- Verify the temporal range has data availability
- Confirm that the area of interest overlaps the collection footprint
- Check band names against the collection metadata

### Processing fails

- Start from examples in the [openEO Cookbook](https://openeo.org/documentation/1.0/cookbook/)
- Validate dimensions before reducing/aggregating
- Build incrementally: load → filter → compute → visualise


# Key Concepts

### Sentinel-2 Band Quick Reference

| Band | Name | Resolution | Common Use |
|---|---|---|---|
| B02 | Blue | 10m | True colour, water |
| B03 | Green | 10m | True colour, NDWI |
| B04 | Red | 10m | True colour, NDVI |
| B08 | NIR | 10m | NDVI, false colour |
| B11 | SWIR1 | 20m | Moisture, snow |
| B12 | SWIR2 | 20m | Moisture, geology |
| SCL | Scene Classification | 20m | Cloud masking |

Full reference: [Sentinel-2 MSI technical guide](https://sentinels.copernicus.eu/web/sentinel/technical-guides/sentinel-2-msi).

### Datacubes

openEO data is modelled as [datacubes](https://openeo.org/documentation/1.0/datacubes.html): multi-dimensional arrays over space (`x`, `y`), time (`t`), and bands (`bands`).

### Bands

In openEO Studio, **bands are the key input to almost every workflow**:

- You pick bands in the `Configuration` tab.
- The loader passes those bands into the datacube request.
- Your code in the `Code` tab consumes those bands for RGB rendering, indices, and reducers.

Practical rules:

- Keep band order explicit for RGB workflows.
- Verify collection-specific naming (for example `B04` vs `reflectance|b04`) in metadata.
- Choose only the bands needed for your workflow to keep graphs simpler and easier to debug.

### Processes and process graphs

- You compose operations from the [openEO processes catalog](https://processes.openeo.org/).
- openEO Studio translates your workflow to a standard [process graph](https://openeo.org/documentation/1.0/glossary.html).
- That graph is portable across [openEO clients](https://openeo.org/software.html#clients).

Useful references:

- [openEO Cookbook](https://openeo.org/documentation/1.0/cookbook/)
- [Python client process usage](https://open-eo.github.io/openeo-python-client/processes.html)
- [Python client DataCube API](https://open-eo.github.io/openeo-python-client/api.html)


# Contributing

openEO Studio is open source software available at https://github.com/developmentseed/openeo-studio
