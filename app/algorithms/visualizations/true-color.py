"""
True Color Visualization Algorithm for Sentinel-2 imagery.
Combines RGB bands (B04, B03, B02) to create a natural color visualization.
"""


def viz(data):
    """Apply true color transformation to spectral bands."""
    B02, B03, B04 = (
        data[0],
        data[1],
        data[2],
    )
    # True color for land (enhanced)
    true_color_b = B04 * 3
    true_color_r = B03 * 3
    true_color_g = B02 * 5
    return array_create([true_color_r, true_color_g, true_color_b])


# Apply the visualization function
map_viz = datacube.apply_dimension(dimension="spectral", process=viz)

# Scale values to 0-255 range for PNG output
map_viz = map_viz.linear_scale_range(
    input_min=0, input_max=1, output_min=0, output_max=255
)

# Save as PNG and return JSON representation
map_viz = map_viz.save_result("PNG")
map_viz.to_json()
