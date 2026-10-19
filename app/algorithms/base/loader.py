"""
Base data loader script for Sentinel-2 L2A imagery.
This script is combined with algorithm scripts to create complete processing workflows.

Parameters are dynamically instantiated with the user-selected run configuration.
Uses OpenEO Parameter objects for proper type validation and service graph integration.
"""

import json
import re
from openeo.internal.graph_building import PGNode
from openeo.rest.datacube import DataCube
from openeo.rest.result import SaveResult
from openeo.processes import array_create, absolute, and_, clip, if_, linear_scale_range, process, sqrt
from openeo.api.process import Parameter

# Initialize parameters with run configuration
# These will be populated from ExecutionConfig at runtime
default_collection_id = RUN_CONFIG.get("collectionId", "sentinel-2-l2a")
default_bounding_box = RUN_CONFIG.get("boundingBox", {"west": 12.0, "south": 44.5, "east": 14, "north": 46})
default_time = RUN_CONFIG.get("time", ["2025-11-23", "2025-11-24"])
default_bands = RUN_CONFIG.get("bands", ["reflectance|bands=b02", "reflectance|bands=b03", "reflectance|bands=b04"])
# Property filters on collection queryables, e.g.
# {"property": "eo:cloud_cover", "operator": "lt", "value": 20}.
# No default: collections without `eo:cloud_cover` (e.g. Sentinel-1, DEMs)
# would return no items with a cloud cover filter.
default_property_filters = list(RUN_CONFIG.get("propertyFilters", []))
# Deprecated: `cloudCover` is converted to an `eo:cloud_cover` filter.
if RUN_CONFIG.get("cloudCover") is not None and not any(
    f["property"] == "eo:cloud_cover" for f in default_property_filters
):
    default_property_filters.insert(
        0, {"property": "eo:cloud_cover", "operator": "lt", "value": RUN_CONFIG["cloudCover"]}
    )

# Create OpenEO Parameter objects
bounding_box = Parameter("bounding_box", default=default_bounding_box, optional=True)
time = Parameter("time", default=default_time, optional=True)
bands = Parameter("bands", default=[f"{band}" for band in default_bands], optional=True)

# Parameter collection for service creation
parameters = [
    time,
    bounding_box,
    bands,
]

load_collection_args = {
    "id": default_collection_id,
    "spatial_extent": bounding_box,
    "temporal_extent": time,
    "bands": bands,
}

def property_condition(operator: str, parameter_name: str) -> dict:
    """Builds a `load_collection` property condition: `<operator>(value, parameter)`."""
    return {
        "process_graph": {
            "cc": {
                "process_id": operator,
                "arguments": {"x": {"from_parameter": "value"}, "y": {"from_parameter": parameter_name}},
                "result": True,
            }
        }
    }


def property_parameter_name(property_name: str) -> str:
    """Builds a valid openEO parameter name from a property, e.g. `sat:orbit_state` -> `filter_sat_orbit_state`."""
    return "filter_" + re.sub(r"\W+", "_", property_name).strip("_").lower()


# One parameter per filter, so services can override the value
properties = {}
ALLOWED_OPERATORS = {"lt", "lte", "gt", "gte", "eq", "neq"}
for property_filter in default_property_filters:
    property_name = property_filter["property"]
    operator = property_filter["operator"]
    if property_name in properties or operator not in ALLOWED_OPERATORS:
        continue
    parameter_name = property_parameter_name(property_name)
    parameters.append(Parameter(parameter_name, default=property_filter["value"], optional=True))
    properties[property_name] = property_condition(operator, parameter_name)

if properties:
    load_collection_args["properties"] = properties

# Load collection with parameterized configuration
graph = PGNode("load_collection", **load_collection_args)

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
