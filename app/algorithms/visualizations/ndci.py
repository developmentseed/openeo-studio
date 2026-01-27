# CyanoLakes Chlorophyll-a Visualization for Cyanobacteria Detection
def cyanobacteria_chl_a_visualization(data):
    """
    Apply CyanoLakes Chlorophyll-a visualization
    Input data array: [B02, B03, B04, B05, B08, B8A, B11, B12]
    """
    B02, B03, B04, B05, B08, B8A, B11, B12 = (
        data[0],
        data[1],
        data[2],
        data[3],
        data[4],
        data[5],
        data[6],
        data[7],
    )

    MNDWI_threshold = 0.42
    NDWI_threshold = 0.4
    filter_UABS = True
    # filter_SSI = False

    def water_body_identification(B04, B03, B02, B8A, B11, B12):
        """Identify water bodies using spectral indices."""

        # var ndvi=(nir-r)/(nir+r),mndwi=(g-swir1)/(g+swir1),ndwi=(g-nir)/(g+nir),ndwi_leaves=(nir-swir1)/(nir+swir1),aweish=b+2.5*g-1.5*(nir+swir1)-0.25*swir2,aweinsh=4*(g-swir1)-(0.25*nir+2.75*swir1);

        MNDWI_val = (B03 - B11) / (B03 + B11)
        NDWI_val = (B03 - B8A) / (B03 + B8A)
        NDVI_val = (B8A - B04) / (B8A + B04)
        NDWI_leaves = (B8A - B11) / (B8A + B11)
        AWEISH = B02 + 2.5 * B03 - 1.5 * (B8A + B11) - 0.25 * B12
        AWEINSH = 4 * (B03 - B11) - (0.25 * B8A + 2.75 * B11)

        # var dbsi=((swir1-g)/(swir1+g))-ndvi,wii=Math.pow(nir,2)/r,wri=(g+r)/(nir+swir1),puwi=5.83*g-6.57*r-30.32*nir+2.25,uwi=(g-1.1*r-5.2*nir+0.4)/Math.abs(g-1.1*r-5.2*nir),usi=0.25*(g/r)-0.57*(nir/g)-0.83*(b/g)+1;

        DBSI = ((B11 - B03) / (B11 + B03)) - NDVI_val
        # WII = (B8A**2) / B04
        # WRI = (B03 + B04) / (B8A + B11)
        # PUWI = 5.83 * B03 - 6.57 * B04 - 30.32 * B8A + 2.25
        # UWI = (B03 - 1.1 * B04 - 5.2 * B8A + 0.4) / absolute(B03 - 1.1 * B04 - 5.2 * B8A)
        # USI = 0.25 * (B03 / B04) - 0.57 * (B8A / B03) - 0.83 * (B02 / B03) + 1

        # if (mndwi>MNDWI_threshold||ndwi>NDWI_threshold||aweinsh>0.1879||aweish>0.1112||ndvi<-0.2||ndwi_leaves>1) {ws=1;}

        water = if_(
            MNDWI_val > MNDWI_threshold,
            1,
            if_(
                NDWI_val > NDWI_threshold,
                1,
                if_(
                    AWEINSH > 0.1879,
                    1,
                    if_(
                        AWEISH > 0.1112,
                        1,
                        if_(NDVI_val < -0.2, 1, if_(NDWI_leaves > 1, 1, 0)),
                    ),
                ),
            ),
        )

        # //filter urban areas [3] and bare soil [10]
        # if (filter_UABS && ws==1) {
        #     if ((aweinsh<=-0.03)||(dbsi>0)) {ws=0;}
        # }
        water = if_(
            and_(filter_UABS, (water == 1)),
            if_(AWEINSH <= -0.03, 0, if_(DBSI > 0, 0, water)),
            water,
        )

        return water

    # Water mask (1 = water, 0 = land)
    water = water_body_identification(B04, B03, B02, B8A, B11, B12)

    # Floating Algae Index
    NIR2 = B04 + (B11 - B04) * ((832.8 - 664.6) / (1613.7 - 664.6))
    FAI_val = B08 - NIR2
    # FAI_val = B07 - (B04 + (B8A - B04) * ((783.0 - 665.0) / (865.0 - 665.0)))

    # NDCI and Chlorophyll-a
    NDCI_val = (B05 - B04) / (B05 + B04)
    chl = 826.57 * (NDCI_val**3) - 176.43 * (NDCI_val**2) + 19 * NDCI_val + 4.071

    # True color for land
    true_color_r = B04 * 3
    true_color_g = B03 * 3
    true_color_b = B02 * 3

    # Create a spatial ones array to give scalar colors spatial dimensions
    spatial_ones = B04 * 0 + 1

    # Define color mapping based on chlorophyll-a concentration
    # Surface blooms (FAI > 0.08): red
    red_bloom = array_create(
        [
            spatial_ones * (233 / 255),
            spatial_ones * (72 / 255),
            spatial_ones * (21 / 255),
        ]
    )

    # Chlorophyll-a concentration color scale
    # < 0.5: deep blue
    color_0_5 = array_create(
        [spatial_ones * 0.0, spatial_ones * 0.0, spatial_ones * 1.0]
    )
    # 0.5-2.5: blue
    color_2_5 = array_create(
        [spatial_ones * 0.0, spatial_ones * (59 / 255), spatial_ones * 1.0]
    )
    # 2.5-5: blue-cyan
    color_5 = array_create(
        [
            spatial_ones * (15 / 255),
            spatial_ones * (113 / 255),
            spatial_ones * (141 / 255),
        ]
    )
    # 5-8: cyan-green
    color_8 = array_create(
        [
            spatial_ones * (13 / 255),
            spatial_ones * (141 / 255),
            spatial_ones * (103 / 255),
        ]
    )
    # 8-14: green
    color_14 = array_create(
        [
            spatial_ones * (42 / 255),
            spatial_ones * (226 / 255),
            spatial_ones * (28 / 255),
        ]
    )
    # 14-24: yellow-green
    color_24 = array_create(
        [spatial_ones * (134 / 255), spatial_ones * (247 / 255), spatial_ones * 0.0]
    )
    # 24-38: yellow
    color_38 = array_create(
        [spatial_ones * (208 / 255), spatial_ones * (240 / 255), spatial_ones * 0.0]
    )
    # 38-75: yellow-orange
    color_75 = array_create(
        [
            spatial_ones * (248 / 255),
            spatial_ones * (207 / 255),
            spatial_ones * (2 / 255),
        ]
    )
    # 75-150: orange
    color_150 = array_create(
        [
            spatial_ones * (240 / 255),
            spatial_ones * (159 / 255),
            spatial_ones * (8 / 255),
        ]
    )
    # 150-350: red-orange
    color_350 = array_create(
        [
            spatial_ones * (239 / 255),
            spatial_ones * (101 / 255),
            spatial_ones * (15 / 255),
        ]
    )
    # > 350: red
    color_max = array_create(
        [
            spatial_ones * (233 / 255),
            spatial_ones * (72 / 255),
            spatial_ones * (21 / 255),
        ]
    )

    # True color for non-water
    land_color = array_create([true_color_r, true_color_g, true_color_b])

    # Apply conditional color mapping
    # Non-water pixels: true color
    # Water with FAI > 0.08: red (floating algae)
    # Water with various chl-a levels: color gradient

    result = if_(
        water == 0,
        land_color,
        if_(
            FAI_val > 0.08,
            red_bloom,
            if_(
                chl < 0.5,
                color_0_5,
                if_(
                    chl < 2.5,
                    color_2_5,
                    if_(
                        chl < 5,
                        color_5,
                        if_(
                            chl < 8,
                            color_8,
                            if_(
                                chl < 14,
                                color_14,
                                if_(
                                    chl < 24,
                                    color_24,
                                    if_(
                                        chl < 38,
                                        color_38,
                                        if_(
                                            chl < 75,
                                            color_75,
                                            if_(
                                                chl < 150,
                                                color_150,
                                                if_(chl < 350, color_350, color_max),
                                            ),
                                        ),
                                    ),
                                ),
                            ),
                        ),
                    ),
                ),
            ),
        ),
    )

    return result

# Apply the visualization function
chl_a_image = reduced.apply_dimension(
    dimension="bands", process=cyanobacteria_chl_a_visualization
)
# Save as TIFF
chl_a_image = chl_a_image.linear_scale_range(
    input_min=0, input_max=1, output_min=0, output_max=255
)
chl_a_image = chl_a_image.save_result("PNG")

add_graph_to_map(chl_a_image, "NDCI")
