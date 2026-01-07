"""
Base data loader script for Sentinel-2 L2A imagery.
This script is combined with algorithm scripts to create complete processing workflows.

Handlebars template variables:
- collectionId: Collection identifier for the data source
- selectedBands: Array of band names (e.g., ['b02', 'b03', 'b04'])
- temporalRange: Array with start and end date strings (e.g., ['2025-07-01', '2025-07-31'])
"""

from openeo.internal.graph_building import PGNode
from openeo.rest.datacube import DataCube
from openeo.rest.result import SaveResult
from openeo.processes import array_create, if_, absolute, and_
from openeo.api.process import Parameter

# Prepare parameters
spatial_extent = {"west": 12.0, "south": 44.5, "east": 14, "north": 46}
temporal_extent = {{temporalRange}}
bounding_box = Parameter("bounding_box", default=spatial_extent, optional=True)
time = Parameter("time", default=temporal_extent, optional=True)
bands = Parameter("bands", default= [
    {{#each selectedBands}}
            "reflectance|{{this}}",
    {{/each}}
    ], optional=True)
     
# Load collection with spatial extent and band selection
# Collection ID and bands are dynamically injected
graph = PGNode(
    "load_collection",
    id="{{collectionId}}",
    spatial_extent=bounding_box,
    temporal_extent=time,
    bands=bands,
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
