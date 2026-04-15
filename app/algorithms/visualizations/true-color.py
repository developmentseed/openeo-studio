"""
True Color Visualization Algorithm for Sentinel-2 imagery.
Combines RGB bands (B04, B03, B02) to create a natural color visualization.
"""

rgb = reduced.linear_scale_range( 
    input_min=0, input_max=0.4, output_min=0, output_max=255
)
map_viz = rgb.save_result("PNG")

add_graph_to_map(map_viz, "True Color")
