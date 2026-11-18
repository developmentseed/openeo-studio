# Braaten-Cohen-Yang Cloud Detector
# Detects thick and thin clouds using SWIR and green bands.
# The algorithm defines a subspace in Sentinel-2 spectral space that
# captures most cloud pixels using simple threshold tests on the green
# band and NDGR, with an additional SWIR constraint to reduce snow misclassification.
#
# Reference: https://custom-scripts.sentinel-hub.com/sentinel-2/cby_cloud_detection/
# License: CC-BY-SA-4.0
def cloud_detection(data):
    """
    Input data array: [B02, B03, B04, B11]
    """
    B02, B03, B04, B11 = (data[0], data[1], data[2], data[3])

    bRatio = (B03 - 0.175) / (0.39 - 0.175)
    NDGR = (B03 - B04) / (B03 + B04)
    gain = 2.5

    v_thick = 0.5 * (bRatio - 1)
    v_thin = 5 * op.sqrt(bRatio * NDGR)

    thick = op.and_(B11 > 0.1, bRatio > 1)
    thin = op.and_(B11 > 0.1, op.and_(bRatio > 0, NDGR > 0))

    red = op.if_(
        thick,
        0.5 * op.clip(B04, 0, 1),
        op.if_(
            thin,
            0.5 * op.clip(B04, 0, 1) + v_thin,
            gain * B04
        ),
    )
    green = op.if_(
        thick,
        0.5 * op.clip(B03, 0, 1),
        op.if_(
            thin,
            0.5 * op.clip(B03, 0, 1),
            gain * B03
        )
    )
    blue = op.if_(
        thick,
        0.5 * op.clip(B02, 0, 1) + v_thick,
        op.if_(
            thin,
            0.5 * op.clip(B02, 0, 1),
            gain * B02),
    )

    red = op.clip(red, 0, 1)
    green = op.clip(green, 0, 1)
    blue = op.clip(blue, 0, 1)

    result = op.array_create([
        red, green, blue
    ])

    return result

# Apply cloud detection on the data cube on the bands dimension
cloud_image = reduced.apply_dimension(dimension="bands", process=cloud_detection)
# Linear scale to 0-255 for RGB visualization
cloud_image = cloud_image.linear_scale_range(
    input_min=0, input_max=1, output_min=0, output_max=255
)
# Define PNG visualization
cloud_image = cloud_image.save_result("PNG")

add_graph_to_map(cloud_image, "Cloud Detection (Braaten-Cohen-Yang)")
