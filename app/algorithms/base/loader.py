"""
Base data loader script for Sentinel-2 L2A imagery.
This script is combined with algorithm scripts to create complete processing workflows.

Handlebars template variables:
- sceneUrl: S3 URL to the Zarr store
"""

from openeo.internal.graph_building import PGNode
from openeo.rest.datacube import DataCube
from openeo.rest.result import SaveResult
from openeo.processes import array_create, if_, absolute, and_

# Load collection with spatial extent and band selection
# URL is dynamically injected from the selected scene
graph = PGNode(
    "load_collection",
    id="{{sceneUrl}}",
    spatial_extent={
        "east": {"from_parameter": "spatial_extent_east"},
        "north": {"from_parameter": "spatial_extent_north"},
        "south": {"from_parameter": "spatial_extent_south"},
        "west": {"from_parameter": "spatial_extent_west"},
    },
    temporal_extent=["2025-07-01", "2025-07-31"],
    bands=[
            "reflectance|b02",
            "reflectance|b03",
            "reflectance|b04",
        ],
    properties={
        "eo:cloud_cover": {
            "process_graph": {
                "cc": {
                    "process_id": "lt",
                    "arguments": {"x": {"from_parameter": "value"}, "y": 20},
                    "result": True,
                }
            }
        }
    }
)

datacube = DataCube(graph=graph)

# Extract bands for use in algorithms
B02 = datacube.band("reflectance|b02")  # Blue
B03 = datacube.band("reflectance|b03")  # Green
B04 = datacube.band("reflectance|b04")  # Red
# B05 = datacube.band("reflectance|b05")  # Red Edge 1
# B07 = datacube.band("reflectance|b07")  # Red Edge 3
# B08 = datacube.band("reflectance|b08")  # NIR
# B8A = datacube.band("reflectance|b8a")  # Narrow NIR
# B11 = datacube.band("reflectance|b11")  # SWIR 1
# B12 = datacube.band("reflectance|b12")  # SWIR 2
