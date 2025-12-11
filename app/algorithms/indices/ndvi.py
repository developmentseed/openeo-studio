"""
NDVI (Normalized Difference Vegetation Index) Algorithm for Sentinel-2 imagery.
Calculates vegetation health index using NIR and Red bands.
"""


def ndvi_calc(data):
    """Calculate NDVI from NIR and Red bands."""
    B04, B08 = data[2], data[5]  # Red, NIR
    
    # NDVI = (NIR - Red) / (NIR + Red)
    ndvi = (B08 - B04) / (B08 + B04)
    
    # Apply color gradient: red (low) -> yellow -> green (high)
    # Map NDVI range [-1, 1] to color values
    return array_create([
        if_(ndvi < 0, absolute(ndvi), 0),  # Red channel: negative values
        if_(ndvi > 0, ndvi, 0),            # Green channel: positive values
        0                                   # Blue channel: zero
    ])


# Apply the NDVI calculation
map_viz = datacube.apply_dimension(dimension="spectral", process=ndvi_calc)

# Scale values to 0-255 range for PNG output
map_viz = map_viz.linear_scale_range(
    input_min=0, input_max=1, output_min=0, output_max=255
)

# Save as PNG and return JSON representation
map_viz = map_viz.save_result("PNG")
map_viz.to_json()
