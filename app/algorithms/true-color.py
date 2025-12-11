def viz(data):
    B02, B03, B04 = (
        data[0],
        data[1],
        data[2],
    )
    # True color for land
    true_color_b = B04 * 3
    true_color_r = B03 * 3
    true_color_g = B02 * 5
    return array_create([true_color_r, true_color_g, true_color_b])

map_viz = datacube.apply_dimension(dimension="spectral", process=viz)
map_viz = map_viz.linear_scale_range(
    input_min=0, input_max=1, output_min=0, output_max=255
)

map_viz = map_viz.save_result("PNG")
map_viz.to_json()
