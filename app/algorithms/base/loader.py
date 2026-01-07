"""
Base data loader script for Sentinel-2 L2A imagery.
This script is combined with algorithm scripts to create complete processing workflows.

Parameters are dynamically instantiated with scene defaults and user selections.
Uses OpenEO Parameter objects for proper type validation and service graph integration.
"""

import json
from openeo.internal.graph_building import PGNode
from openeo.rest.datacube import DataCube
from openeo.rest.result import SaveResult
from openeo.processes import array_create, if_, absolute, and_
from openeo.api.process import Parameter

# Initialize parameters with scene defaults
# These will be populated from ExecutionConfig at runtime
spatial_extent = SCENE_DEFAULTS.get("bbox", {"west": 12.0, "south": 44.5, "east": 14, "north": 46})
temporal_extent = SCENE_DEFAULTS.get("temporalRange", ["2025-11-23", "2025-11-24"])
selected_bands = SCENE_DEFAULTS.get("selectedBands", ["b02", "b03", "b04"])
collection_id = SCENE_DEFAULTS.get("collectionId", "sentinel-2-l2a")
cloud_cover_max = SCENE_DEFAULTS.get("cloudCover", 20)

# Create OpenEO Parameter objects
bounding_box = Parameter("bounding_box", default=spatial_extent, optional=True)
time = Parameter("time", default=temporal_extent, optional=True)
bands = Parameter("bands", default=[f"reflectance|{band}" for band in selected_bands], optional=True)

# Parameter collection for service creation
parameters = [
    time,
    bounding_box,
    bands,
]

# Load collection with parameterized configuration
graph = PGNode(
    "load_collection",
    id=collection_id,
    spatial_extent=bounding_box,
    temporal_extent=time,
    bands=bands,
    properties={
        "eo:cloud_cover": {
            "process_graph": {
                "cc": {
                    "process_id": "lt",
                    "arguments": {"x": {"from_parameter": "value"}, "y": cloud_cover_max},
                    "result": True,
                }
            }
        }
    }
)

datacube = DataCube(graph=graph)

# Collection for multiple graph outputs
map_graphs = []

def add_graph_to_map(graph: PGNode, name: str = None) -> SaveResult:
    """Helper function to add the process graph to the map visualization.
    
    Args:
        graph: The process graph node to add
        name: Optional user-defined layer name. Defaults to variable name if not provided.
    """
    import inspect
    
    # Get variable name from caller if name not provided
    if name is None:
        frame = inspect.currentframe().f_back
        name = [k for k, v in frame.f_locals.items() if v is graph][0] if frame else "layer"
    
    map_graphs.append({
        "process_graph": graph.flat_graph(),
        "parameters": [param.to_dict() for param in parameters],
        "name": name,
        "visible": True
    })
    return SaveResult(graph)


reduced = datacube.process(
    "apply_pixel_selection",
    pixel_selection="first",
    data=datacube,
)
