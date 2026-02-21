"""
False Color Short-Wave Infra-Red (SWIR) Visualization Algorithm for Sentinel-2 imagery.
Uses Red, SWIR1, and SWIR2 bands (B04, B11, B12) to highlight hot surfaces such as fresh lava.
"""


def viz(data):
    """Apply false color transformation emphasizing lava."""
    B04, B11, B12 = (
        data[0],  # Red
        data[1],  # SWIR1
        data[2],  # SWIR2
    )
    # False color for lava analysis
    false_color_r = B12 * 3  # SWIR2 as red
    false_color_g = B11 * 3  # SWIR1 as green
    false_color_b = B04 * 3  # Red as blue
    return array_create([false_color_r, false_color_g, false_color_b])


# Apply the visualization function
map_viz = datacube.apply_dimension(dimension="spectral", process=viz)

# Scale values to 0-255 range for PNG output
map_viz = map_viz.linear_scale_range(
    input_min=0, input_max=1, output_min=0, output_max=255
)

# Save as PNG and return JSON representation
map_viz = map_viz.save_result("PNG")
map_viz.to_json()
