# openEO Studio Documentation

openEO Studio is a browser-based sandbox for building and exploring [openEO](https://openeo.org/) workflows with immediate visual feedback. You can discover data, compose workflows in Python syntax from the [openEO Python client](https://open-eo.github.io/openeo-python-client/), and see results directly on a live map.

Studio is designed for fast onboarding and prototyping. For large-scale, production, or batch processing, move to the full [openEO Python client](https://open-eo.github.io/openeo-python-client/).

## Getting Started

### What Studio is

- A low-code entry point into the [openEO ecosystem](https://openeo.org/software.html)
- A way to build standard [openEO process graphs](https://openeo.org/documentation/1.0/glossary.html) without local setup
- A live exploration environment where map tiles are computed on demand

### Who it is for

- EO analysts prototyping workflows quickly
- Researchers exploring [datacube](https://openeo.org/documentation/1.0/datacubes.html)-based analysis
- Users learning openEO before moving to code-first pipelines

### How Studio works (mental model)

1. You write Python-like workflow code using [openEO Python client syntax](https://open-eo.github.io/openeo-python-client/basics.html).
2. Studio runs that code in-browser with [Pyodide](https://pyodide.org/) (Python on [WebAssembly](https://webassembly.org/)).
3. The output is a standard [process graph](https://openeo.org/documentation/1.0/glossary.html).
4. The process graph is rendered as map tiles via [titiler-openeo](https://github.com/sentinel-hub/titiler-openeo) / [TiTiler](https://github.com/developmentseed/titiler).

There is no separate “run and then view” flow here: **the map is the result**.

## Quick Start: RGB in 5 Minutes (Studio Workflow)

This walkthrough follows Studio’s native flow for true-color RGB (`B04`, `B03`, `B02`) inspired by the [Manhattan notebook](https://github.com/sentinel-hub/titiler-openeo/blob/main/docs/src/notebooks/manhattan.ipynb).

### 1) Start from the landing page

On the [home screen](/), click **Start from Scratch** to open a blank editor session.

### 2) Configure the datacube in the Configuration tab

Set your input data first in **Configuration**:

- Collection: [Sentinel-2](https://documentation.dataspace.copernicus.eu/Data/SentinelMissions/Sentinel2.html)
- Temporal range: choose the period you want to visualize
- Cloud cover: set a threshold for filtering
- Bands: select `red`, `green`, `blue` for true color (mind the order!)

Studio’s base loader uses this configuration to create the input datacube and applies a generic bounding box for map exploration.

Band selection is central to Studio workflows: the bands you choose in Configuration define what is available in Code for index formulas, RGB composites, and masking.

### 3) Insert algorithm code in the Code tab

In **Code**, write only the visualization logic. The loader already provides:

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

### 4) Hit "Apply!" and explore the result live on the map

You can pan and zoom to inspect local detail. What you see is a very very simple workflow where use the first time slice of the datacube (`reduced`), applies a linear scaling for visualization enhancement, and output the result as a PNG.

## Core Concepts

### Datacubes

openEO data is modelled as [datacubes](https://openeo.org/documentation/1.0/datacubes.html): multi-dimensional arrays over space (`x`, `y`), time (`t`), and bands (`bands`).

### Bands (key concept)

In Studio, **bands are the key input to almost every workflow**:

- You pick bands in the **Configuration** tab.
- The loader passes those bands into the datacube request.
- Your code in the **Code** tab consumes those bands for RGB rendering, indices, and reducers.

Practical rules:

- Keep band order explicit for RGB workflows.
- Verify collection-specific naming (for example `B04` vs `reflectance|b04`) in metadata.
- Choose only the bands needed for your workflow to keep graphs simpler and easier to debug.

### Processes and process graphs

- You compose operations from the [openEO processes catalog](https://processes.openeo.org/).
- Studio translates your workflow to a standard [process graph](https://openeo.org/documentation/1.0/glossary.html).
- That graph is portable across [openEO clients](https://openeo.org/software.html#clients).

Useful references:

- [openEO Cookbook](https://openeo.org/documentation/1.0/cookbook/)
- [Python client process usage](https://open-eo.github.io/openeo-python-client/processes.html)
- [Python client DataCube API](https://open-eo.github.io/openeo-python-client/api.html)

## Workflow Examples

### Beginner

1. **True colour** (`B04`, `B03`, `B02`) using [Sentinel-2 band guidance](https://documentation.dataspace.copernicus.eu/Data/SentinelMissions/Sentinel2.html) and [True Color reference](https://custom-scripts.sentinel-hub.com/sentinel-2/true_color/)
2. **NDVI** for vegetation vigour with [`ndvi`](https://processes.openeo.org/#ndvi)
3. **Temporal subset** with [`filter_temporal`](https://processes.openeo.org/#filter_temporal)
4. **AOI clipping** with [`filter_bbox`](https://processes.openeo.org/#filter_bbox) / [`filter_spatial`](https://processes.openeo.org/#filter_spatial)

### Intermediate

1. **Cloud-masked composite** with [SCL](https://sentinels.copernicus.eu/web/sentinel/technical-guides/sentinel-2-msi/level-2a/algorithm-overview), [`mask`](https://processes.openeo.org/#mask), and temporal [`reduce_dimension`](https://processes.openeo.org/#reduce_dimension)
2. **Water detection (NDWI)** from `B03`/`B08` ([NDWI background](https://en.wikipedia.org/wiki/Normalized_difference_water_index))
3. **Change detection** between periods with temporal reducers
4. **Custom band math** with [spectral index cookbook patterns](https://open-eo.github.io/openeo-python-client/cookbook/spectral_indices.html)

### Ready-to-use workflow sources

- **Primary source**: [openeo-udp notebooks](https://github.com/developmentseed/openeo-udp)
- [Enhanced NDVI notebook](https://github.com/developmentseed/openeo-udp/blob/main/notebooks/sentinel/sentinel-2/remote_sensing_indices/ndvi_enhanced.ipynb)
- [NDCI cyanobacteria notebook](https://github.com/developmentseed/openeo-udp/blob/main/notebooks/sentinel/sentinel-2/marine_and_water_bodies/ndci_cyanobacteria.ipynb)
- [Cloud detection notebook](https://github.com/developmentseed/openeo-udp/blob/main/notebooks/sentinel/sentinel-2/cloud_detection/cohen_braaten_yang_cloud_detection.ipynb)
- [BAIS2 burned area notebook](https://github.com/developmentseed/openeo-udp/blob/main/notebooks/sentinel/sentinel-2/fire/bais2_burned_area.ipynb)
- [Sentinel Hub Custom Scripts library](https://custom-scripts.sentinel-hub.com/)

## Features Guide

### Data discovery

Use available [collections](https://openeo.org/documentation/1.0/glossary.html) and metadata to choose the right source, spatial extent, and time window. For Copernicus-backed datasets, see:

- [Copernicus Data Space](https://dataspace.copernicus.eu/)
- [CDSE STAC catalog](https://documentation.dataspace.copernicus.eu/APIs/STAC.html)
- [CDSE openEO documentation](https://documentation.dataspace.copernicus.eu/APIs/openEO/openEO.html)

### Live map exploration

- Every visible tile is computed at request time
- Zoom level and map position change what is computed
- Parameter tweaks (dates, bands, formulas) are reflected immediately

### Validation and errors

Studio performs lightweight checks before map rendering, helping catch common issues early:

- Band naming mismatch (for example `B04` vs `B4`)
- Invalid [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) temporal extents
- Dimension/process mismatch
- CRS assumptions and projection confusion ([spatial reference system](https://en.wikipedia.org/wiki/Spatial_reference_system))

## Sentinel-2 Band Quick Reference

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

## FAQ / Troubleshooting

### Why does my map look empty?

- Verify the temporal range has data availability
- Confirm AOI overlaps the chosen collection footprint
- Check band names against the selected collection metadata

### Why do I get process errors?

- Start from examples in the [openEO Cookbook](https://openeo.org/documentation/1.0/cookbook/)
- Validate dimensions before reducing/aggregating
- Build incrementally: load → filter → compute → visualise

### When should I move beyond Studio?

Move to the [openEO Python client](https://open-eo.github.io/openeo-python-client/) when you need repeatable pipelines, automation, larger areas, job orchestration, or deeper production control.

## For Contributors

### Architecture at a glance

- Client-side Python execution with [Pyodide](https://pyodide.org/)
- Tile-serving flow through [titiler-openeo](https://github.com/sentinel-hub/titiler-openeo)
- Standards-based interoperability through [openEO](https://openeo.org/)

### Learn more

- [openEO GitHub organization](https://github.com/Open-EO)
- [openEO Python client repository](https://github.com/Open-EO/openeo-python-client)
- [openEO Web Editor](https://editor.openeo.org/) and [source](https://github.com/Open-EO/openeo-web-editor)
- [APEx programme](https://apex.esa.int/) and [documentation](https://esa-apex.github.io/apex_documentation/)

## Resource Hub

### openEO

- [openEO main site](https://openeo.org/)
- [Glossary](https://openeo.org/documentation/1.0/glossary.html)
- [Datacubes](https://openeo.org/documentation/1.0/datacubes.html)
- [Cookbook](https://openeo.org/documentation/1.0/cookbook/)
- [Processes catalog](https://processes.openeo.org/)

### openEO Python Client

- [Docs home](https://open-eo.github.io/openeo-python-client/)
- [Getting started](https://open-eo.github.io/openeo-python-client/basics.html)
- [Data access](https://open-eo.github.io/openeo-python-client/data_access.html)
- [Cookbook index](https://open-eo.github.io/openeo-python-client/cookbook/index.html)

### Copernicus Data Space

- [CDSE portal](https://dataspace.copernicus.eu/)
- [CDSE openEO docs](https://documentation.dataspace.copernicus.eu/APIs/openEO/openEO.html)
- [CDSE Python quickstart](https://documentation.dataspace.copernicus.eu/APIs/openEO/Python_Client/Python.html)
- [STAC docs](https://documentation.dataspace.copernicus.eu/APIs/STAC.html)
