"""
Base data loader script for Sentinel-2 L2A imagery.
This script is combined with algorithm scripts to create complete processing workflows.

Handlebars template variables:
- collectionId: Collection identifier for the data source
- selectedBands: Array of band names (e.g., ['b02', 'b03', 'b04'])
"""

from openeo.internal.graph_building import PGNode
from openeo.rest.datacube import DataCube
from openeo.rest.result import SaveResult
from openeo.processes import array_create, if_, absolute, and_

# Load collection with spatial extent and band selection
# Collection ID and bands are dynamically injected
graph = PGNode(
    "load_collection",
    id="{{collectionId}}",
    spatial_extent={
        "east": {"from_parameter": "spatial_extent_east"},
        "north": {"from_parameter": "spatial_extent_north"},
        "south": {"from_parameter": "spatial_extent_south"},
        "west": {"from_parameter": "spatial_extent_west"},
        "crs": "EPSG:3857",
    },
    temporal_extent=["2025-07-01", "2025-07-31"],
    bands=[
    {{#each selectedBands}}
            "reflectance|{{this}}",
    {{/each}}
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

reduced = datacube.process(
    "apply_pixel_selection",
    pixel_selection="first",
    data=datacube,
)

vmap = []
