# dNBR burnt area - Saumos / Le Porge megafire (Gironde, 22 July 2026)
# POST-fire scene: the date range of the project settings (bands below, in order)
#   0 blue, 1 green, 2 red, 3 narrow NIR (B8A), 4 SWIR 2 (B12)
# PRE-fire scene: loaded here, merged in as bands 5 pre NIR, 6 pre SWIR
# Values are surface reflectance, 0 to 1
PRE_FIRE = ["2026-07-01", "2026-07-21"]  # fire started 22 July
BURNT_MIN = 0.27  # dNBR threshold for the mask (USGS: moderate-low severity and up)

# The band dimension of this backend ("bands", "spectral", ...).
DIM = metadata.band_dimension.name if metadata else "bands"

# A second load_collection: the project's collection, area and filters, with
# other dates and the two bands of the NBR.
pre = DataCube(graph=PGNode(
    "load_collection",
    **{**load_collection_args, "temporal_extent": PRE_FIRE, "bands": default_bands[3:5]},
))
pre = pre.process("apply_pixel_selection", pixel_selection="first", data=pre)
pre = pre.rename_labels(dimension=DIM, target=["pre_nir", "pre_swir"])
both = reduced.merge_cubes(pre)


def dnbr_of(data):
    nbr_post = (data[3] - data[4]) / (data[3] + data[4])
    nbr_pre = (data[5] - data[6]) / (data[5] + data[6])
    return nbr_pre - nbr_post


def classes(v, one, colors):
    # USGS dNBR classes: unburnt | low | moderate-low | moderate-high | high
    out = one * colors[4]
    for bound, color in reversed(list(zip([0.1, 0.27, 0.44, 0.66], colors))):
        out = if_(v < bound, one * color, out)
    return out


def severity(data):
    v = dnbr_of(data)
    one = v * 0 + 1
    return array_create([
        classes(v, one, [0.55, 1.0, 1.0, 0.85, 0.45]),
        classes(v, one, [0.75, 0.95, 0.6, 0.15, 0.0]),
        classes(v, one, [0.5, 0.3, 0.1, 0.1, 0.5]),
    ])


def burnt_mask(data):
    burnt = dnbr_of(data) > BURNT_MIN
    grey = clip((data[0] + data[1] + data[2]) * 1.2, 0, 1)
    return array_create([if_(burnt, grey * 0 + 1, grey),
                         if_(burnt, grey * 0 + 0.1, grey),
                         if_(burnt, grey * 0 + 0.1, grey)])


def true_color(data):
    return array_create([data[2], data[1], data[0]])


def layer(cube, fn, name, vmax=1.0):
    img = cube.apply_dimension(dimension=DIM, process=fn)
    img = img.linear_scale_range(input_min=0, input_max=vmax, output_min=0, output_max=255)
    add_graph_to_map(img.save_result("PNG"), name)


layer(reduced, true_color, "Post-fire true color", 0.3)
layer(both, severity, "dNBR severity (yellow low > purple high)")
layer(both, burnt_mask, "Burnt area mask (dNBR > 0.27)")
