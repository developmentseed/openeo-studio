"""
False Color (Infrared) Visualization Algorithm for Sentinel-2 imagery.
Uses NIR, Red, Green bands (B08, B04, B03) to highlight vegetation.
"""


def viz(data):
    """Apply false color transformation emphasizing vegetation."""
    B03, B04, B08 = (
        data[1],  # Green
        data[2],  # Red
        data[5],  # NIR
    )
    # False color for vegetation analysis
    false_color_r = B08 * 3  # NIR as red
    false_color_g = B04 * 3  # Red as green
    false_color_b = B03 * 3  # Green as blue
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
