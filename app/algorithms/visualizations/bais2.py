# Burned Area Index for Sentinel-2 (BAIS2) Visualization
def bais2_visualization(data):
    """
    Apply BAIS2 burned area visualization with color mapping.
    Input data array: [B04, B06, B07, B8A, B12]

    BAIS2 = (1 - sqrt((B06 * B07 * B8A) / B04)) * ((B12 - B8A) / sqrt(B12 + B8A) + 1)

    Color mapping:
    - White: below minimum (no burn)
    - Blue to Yellow: low to moderate burn severity
    - Yellow to Red: moderate to high burn severity
    - Magenta: overflow (active fire)
    """
    B04, B06, B07, B8A, B12 = (
        data[0],
        data[1],
        data[2],
        data[3],
        data[4],
    )

    # Calculate BAIS2
    bais = (1 - ((B06 * B07 * B8A) / B04) ** 0.5) * ((B12 - B8A) / ((B12 + B8A) ** 0.5) + 1)

    min_val = 0.0
    max_val = 0.99
    zero_threshold = 0.5  # Diverging colormap break point

    # Create spatial ones for color calculations
    spatial_ones = bais * 0 + 1

    # White: below minimum (no burn)
    underflow = array_create([
        spatial_ones * 1.0,
        spatial_ones * 1.0,
        spatial_ones * 1.0,
    ])

    # Blue: low burn severity
    low_color = array_create([
        spatial_ones * 0.0,
        spatial_ones * 0.0,
        spatial_ones * 1.0,
    ])

    # Red: high burn severity
    high_color = array_create([
        spatial_ones * (255 / 255),
        spatial_ones * (20 / 255),
        spatial_ones * (20 / 255),
    ])

    # Yellow: moderate burn severity
    zero_color = array_create([
        spatial_ones * (250 / 255),
        spatial_ones * (255 / 255),
        spatial_ones * (10 / 255),
    ])

    # Magenta: overflow (active fire)
    overflow = array_create([
        spatial_ones * (255 / 255),
        spatial_ones * (0 / 255),
        spatial_ones * (255 / 255),
    ])

    def linear_interpolation(color_a, color_b, bais_val, val_min, val_max):
        t = (bais_val - val_min) / (val_max - val_min)
        r = color_a[0] + (color_b[0] - color_a[0]) * t
        g = color_a[1] + (color_b[1] - color_a[1]) * t
        b = color_a[2] + (color_b[2] - color_a[2]) * t
        return array_create([r, g, b])

    result = if_(
        bais < min_val,
        underflow,
        if_(
            bais < zero_threshold,
            linear_interpolation(low_color, zero_color, bais, min_val, zero_threshold),
            if_(
                bais <= max_val,
                linear_interpolation(zero_color, high_color, bais, zero_threshold, max_val),
                overflow,
            ),
        ),
    )
    return result

# Apply BAIS2 on the data cube on the bands dimension
bais2_image = reduced.apply_dimension(dimension="bands", process=bais2_visualization)
# Linear scale to 0-255 for RGB visualization
bais2_image = bais2_image.linear_scale_range(
    input_min=0, input_max=1, output_min=0, output_max=255
)
# Define PNG visualization
bais2_image = bais2_image.save_result("PNG")

add_graph_to_map(bais2_image, "BAIS2 Burned Area")
