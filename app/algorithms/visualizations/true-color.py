"""
True Color Visualization Algorithm for Sentinel-2 imagery.
Combines RGB bands (B04, B03, B02) to create a natural color visualization.
"""

rgb = reduced.linear_scale_range( 
    input_min=0, input_max=1, output_min=0, output_max=255
).apply("trunc")
color = rgb.process(
    "color_formula",
    data=rgb,
    formula="Gamma RGB 1.5 Sigmoidal RGB 8 0.15 Saturation 1.2",
)
map_viz = color.save_result("PNG")

add_graph_to_map(map_viz, "True Color")
