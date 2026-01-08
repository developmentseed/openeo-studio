# Aquatic Plants and Algae Index (APA) Visualization
def apa_viridis_visualization(data):
    """
    Apply viridis colormap to FAI values
    Input data array: [B02, B03, B04, B05, B08, B8A, B11]
    """
    B02, B03, B04, B05, B08, B8A, B11 = (
        data[0],
        data[1],
        data[2],
        data[3],
        data[4],
        data[5],
        data[6],
    )

    # Water detection
    moisture = (B8A - B11) / (B8A + B11)
    NDWI = (B03 - B08) / (B03 + B08)
    water_bodies = (NDWI - moisture) / (NDWI + moisture)

    # indices to identify water plants and algae
    water_plants = (B05 - B04) / (B05 + B04)
    NIR2 = B04 + (B11 - B04) * ((832.8 - 664.6) / (1613.7 - 664.6))
    FAI = B08 - NIR2
    viridis_color = array_create([FAI * 8.5, water_plants * 5.5, NDWI * 1])

    # Cloud detection
    bRatio = (B03 - 0.175) / (0.39 - 0.175)
    NDGR = (B03 - B04) / (B03 + B04)

    # True color for land
    true_color_r = B04 * 3
    true_color_g = B03 * 3
    true_color_b = B02 * 3
    land_color = array_create([true_color_r, true_color_g, true_color_b])

    result = if_(
        and_(B11 > 0.1, bRatio > 1),
        land_color,
        if_(
            and_(B11 > 0.1, and_(bRatio > 0, NDGR > 0)),
            land_color,
            if_(
                NDWI < 0,
                if_(water_bodies > 0, land_color, viridis_color),
                viridis_color
            )
        )
    )
    return result

# Apply APA on the data cube on the bands dimension
apa_image = reduced.apply_dimension(dimension="bands", process=apa_viridis_visualization)
# Linear scale to 0-255 for RGB visualization
apa_image = apa_image.linear_scale_range(
    input_min=0, input_max=0.8, output_min=0, output_max=255
)
# Define PNG visualization
apa_image = apa_image.save_result("PNG")

add_graph_to_map(apa_image, "APA Viridis Visualization")
