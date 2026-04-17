# Lava Flow Visualization using SWIR Band 12
def lava_visualization(data):
    """
    Visualize volcanic lava flows using Sentinel-2 SWIR imagery.
    Input data array: [B02, B03, B04, B08, B11, B12]

    Uses SWIR Band 12 (2202.4 nm) which is highly sensitive to thermal
    emission from molten lava. Active lava flows produce extremely high
    radiance in this band, making it ideal for detecting and mapping
    volcanic activity.

    Styles:
    - Continuous heatmap where lava intensity is encoded using B12 thresholds
    - Active molten lava appears in bright yellow
    - Hot lava in orange-yellow
    - Cooling lava in orange
    - Cool crust in red
    - Base map preserves soil, built-up areas, vegetation, and water
    """
    B02, B03, B04, B08, B11, B12 = (
        data[0],
        data[1],
        data[2],
        data[3],
        data[4],
        data[5],
    )

    # --- Parameters ---
    brightness = 1.0
    offset = 0.0
    lava_threshold = [0.8, 0.5, 0.3, 0.2]  # B12 reflectance thresholds
    lava_sensitivity = 1.0
    boost = 1

    # --- Vegetation and water indices ---
    NDVI = (B08 - B04) / (B08 + B04)
    NDWI = (B03 - B08) / (B03 + B08)

    # --- Base map layers ---
    # True color
    tc_r = B04 * brightness * 3 + offset
    tc_g = B03 * brightness * 3 + offset
    tc_b = B02 * brightness * 3 + offset

    # Urban/SWIR composite for better terrain context
    urban_r = B12 * brightness * 3.5 + offset
    urban_g = B11 * brightness * 3.5 + offset
    urban_b = B04 * brightness * 3 + offset

    # Blend: mix urban SWIR and true color for contextual base
    base_r = urban_r * 0.3 + tc_r * 0.7
    base_g = urban_g * 0.3 + tc_g * 0.7
    base_b = urban_b * 0.3 + tc_b * 0.7

    # Water highlighting (blue tint for water bodies)
    water_detection = and_(and_(NDVI < -0.15, NDWI > 0.15), B04 < 0.2)
    base_g = if_(water_detection, base_g * 1.2 + 0.1, base_g)
    base_b = if_(water_detection, base_b * 1.5 + 0.2, base_b)

    # --- Lava detection and intensity mapping ---
    lava_intensity = B12

    # Intensity classes using B12 thresholds
    mask_0 = lava_intensity > (lava_threshold[0] / lava_sensitivity)  # Active molten

    mask_1 = and_(
        lava_intensity > (lava_threshold[1] / lava_sensitivity),
        lava_intensity <= (lava_threshold[0] / lava_sensitivity),
    )  # Hot lava

    mask_2 = and_(
        lava_intensity > (lava_threshold[2] / lava_sensitivity),
        lava_intensity <= (lava_threshold[1] / lava_sensitivity),
    )  # Cooling lava

    mask_3 = and_(
        lava_intensity > (lava_threshold[3] / lava_sensitivity),
        lava_intensity <= (lava_threshold[2] / lava_sensitivity),
    )  # Cool crust

    # Any lava present
    mask_any = lava_intensity > (lava_threshold[3] / lava_sensitivity)

    # Red channel: boosted for all lava
    r = base_r + (boost * 0.6 * B12 * mask_any)

    # Green channel: weighted by lava intensity classes
    g = base_g + (
        boost
        * B12
        * (
            0.5 * mask_0   # Active molten lava - bright yellow
            + 0.3 * mask_1  # Hot lava - orange-yellow
            + 0.15 * mask_2  # Cooling lava - orange
            + 0.0 * mask_3  # Cool crust - red only
        )
    )

    # Blue channel: unchanged (no blue in lava)
    b = base_b

    return array_create([r, g, b])

# Apply lava visualization on the data cube on the bands dimension
lava_image = reduced.apply_dimension(dimension="bands", process=lava_visualization)
# Linear scale to 0-255 for RGB visualization
lava_image = lava_image.linear_scale_range(
    input_min=0, input_max=1, output_min=0, output_max=255
)
# Define PNG visualization
lava_image = lava_image.save_result("PNG")

add_graph_to_map(lava_image, "Lava Flow Visualization")
