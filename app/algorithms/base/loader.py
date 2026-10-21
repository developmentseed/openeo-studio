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
from openeo.metadata import CollectionMetadata

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
for index, property_filter in enumerate(default_property_filters):
    property_name = property_filter["property"]
    operator = property_filter["operator"]
    if property_name in properties or operator not in ALLOWED_OPERATORS:
        continue
    parameter_name = property_parameter_name(property_name)
    # Distinct properties can give the same name (`a:b` and `a_b`)
    if any(parameter.name == parameter_name for parameter in parameters):
        parameter_name = f"{parameter_name}_{index}"
    parameters.append(Parameter(parameter_name, default=property_filter["value"], optional=True))
    properties[property_name] = property_condition(operator, parameter_name)

if properties:
    load_collection_args["properties"] = properties

# Load collection with parameterized configuration
graph = PGNode("load_collection", **load_collection_args)

class _BandsOnlyMetadata(CollectionMetadata):
    """Metadata that names the bands, and leaves every other dimension name in
    the user's code to the backend, as it did without metadata: code written
    for one backend's names (`"bands"`, `"t"`) still builds on another."""

    def assert_valid_dimension(self, dimension: str) -> str:
        return dimension


# What load_collection loads, so the client's band helpers (`.band()`,
# `filter_bands`) name the backend's own bands dimension and know the bands.
# Studio narrows the bands dimension to the configured bands, in order.
cube_dimensions = RUN_CONFIG.get("cubeDimensions")
metadata = (
    _BandsOnlyMetadata({"id": default_collection_id, "cube:dimensions": cube_dimensions})
    if cube_dimensions
    else None
)

datacube = DataCube(graph=graph, metadata=metadata)

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


def _squashed(identifier):
    return "".join(c for c in str(identifier).lower() if c.isalnum())


def _handles_time(node):
    """Whether a process graph aggregates or reduces over time anywhere."""
    if isinstance(node, dict):
        if str(node.get("process_id", "")).startswith("aggregate_temporal"):
            return True
        if node.get("dimension") in ("t", "time", "temporal"):
            return True
        return any(_handles_time(value) for value in node.values())
    if isinstance(node, list):
        return any(_handles_time(value) for value in node)
    return False


def algorithm(url: str, **values):
    """A published openEO process graph (a user-defined process, by URL) run on
    this project's data. Its load_collection nodes take the collection, area,
    time and property filters configured here; its other parameters take ``values``,
    or their defaults. The result is a cube to scale and save like any other.
    """
    import copy
    import json as _json

    try:
        from pyodide.http import open_url
    except ImportError:  # outside the browser
        from urllib.request import urlopen as open_url
    udp = _json.loads(open_url(url).read())
    graph = copy.deepcopy(udp["process_graph"])
    # What each of the UDP's own parameters becomes: a value given here, this
    # project's area or time for one typed as such, else its default.
    substitutes = {}
    unresolved = []
    for parameter in udp.get("parameters", []):
        name, schema = parameter["name"], parameter.get("schema") or {}
        subtypes = {s.get("subtype") for s in (schema if isinstance(schema, list) else [schema])}
        if name in values:
            substitutes[name] = values[name]
        elif "bounding-box" in subtypes:
            substitutes[name] = {"from_parameter": "bounding_box"}
        elif "temporal-interval" in subtypes:
            substitutes[name] = {"from_parameter": "time"}
        elif "default" in parameter:
            substitutes[name] = parameter["default"]
        else:
            unresolved.append(name)

    def resolve(node):
        if isinstance(node, dict):
            if node.get("from_parameter") in substitutes:
                return substitutes[node["from_parameter"]]
            return {k: resolve(v) for k, v in node.items()}
        if isinstance(node, list):
            return [resolve(v) for v in node]
        return node

    for node in graph.values():
        if node["process_id"] == "load_collection":
            arguments = node["arguments"]
            same = _squashed(arguments.get("id", "")) == _squashed(default_collection_id)
            arguments["id"] = default_collection_id if same else arguments.get("id")
            arguments["spatial_extent"] = {"from_parameter": "bounding_box"}
            arguments["temporal_extent"] = {"from_parameter": "time"}
            if same and properties:
                arguments["properties"] = properties
            elif same:
                arguments.pop("properties", None)
        node["arguments"] = resolve(node["arguments"])
    # A graph that leaves time alone would read every scene in the dates for
    # every tile, and a map shows one image anyway: take the first clear
    # pixel at each load, as `reduced` does.
    if not _handles_time(graph):
        loads = [key for key, node in graph.items() if node["process_id"] == "load_collection"]
        for node in graph.values():
            for argument, value in node["arguments"].items():
                if isinstance(value, dict) and value.get("from_node") in loads:
                    node["arguments"][argument] = {"from_node": value["from_node"] + "_first"}
        for key in loads:
            graph[key + "_first"] = {
                "process_id": "apply_pixel_selection",
                "arguments": {"data": {"from_node": key}, "pixel_selection": "first"},
            }
    if unresolved:
        raise ValueError(f"{url} needs values for {sorted(unresolved)}: algorithm(url, name=value)")
    return DataCube(graph=PGNode.from_flat_graph(graph, parameters={p.name: p for p in parameters}))


reduced = datacube.process(
    "apply_pixel_selection",
    pixel_selection="first",
    data=datacube,
)
