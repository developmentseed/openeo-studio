"""
Base data loader script for Sentinel-2 L2A imagery.
This script is combined with algorithm scripts to create complete processing workflows.
"""

from openeo.internal.graph_building import PGNode
from openeo.rest.datacube import DataCube
from openeo.rest.result import SaveResult
from openeo.processes import array_create, if_, absolute, and_

# Load collection with spatial extent and band selection
graph = PGNode(
    "load_collection",
    url="s3://esa-zarr-sentinel-explorer-fra/tests-output/sentinel-2-l2a/S2A_MSIL2A_20250922T112131_N0511_R037_T29SMD_20250922T160420.zarr",
    spatial_extent={
        "east": {"from_parameter": "spatial_extent_east"},
        "north": {"from_parameter": "spatial_extent_north"},
        "south": {"from_parameter": "spatial_extent_south"},
        "west": {"from_parameter": "spatial_extent_west"},
        "crs":3857,
    },
    options={
        "variables": [
            "/measurements/reflectance/r10m:b02",
            "/measurements/reflectance/r10m:b03",
            "/measurements/reflectance/r10m:b04",
            "/measurements/reflectance/r20m:b05",
            "/measurements/reflectance/r20m:b07",
            "/measurements/reflectance/r10m:b08",
            "/measurements/reflectance/r20m:b8a",
            "/measurements/reflectance/r20m:b11",
            "/measurements/reflectance/r20m:b12",
        ],
        "width": 1024,
        "height": 1024,
    },
)

datacube = DataCube(graph=graph)

# Extract bands for use in algorithms
B02 = datacube.band("/measurements/reflectance/r10m:b02")  # Blue
B03 = datacube.band("/measurements/reflectance/r10m:b03")  # Green
B04 = datacube.band("/measurements/reflectance/r10m:b04")  # Red
B05 = datacube.band("/measurements/reflectance/r20m:b05")  # Red Edge 1
B07 = datacube.band("/measurements/reflectance/r20m:b07")  # Red Edge 3
B08 = datacube.band("/measurements/reflectance/r10m:b08")  # NIR
B8A = datacube.band("/measurements/reflectance/r20m:b8a")  # Narrow NIR
B11 = datacube.band("/measurements/reflectance/r20m:b11")  # SWIR 1
B12 = datacube.band("/measurements/reflectance/r20m:b12")  # SWIR 2
