# Lava flow fusion - Sentinel-2 L2A + Sentinel-1 RTC, La Palma eruption (2021)
# Eruption: 19 Sep - 13 Dec 2021 (Cumbre Vieja).
#
# Project: sentinel-2-l2a, cloud cover < 20, bands (in order):
#   0 b02, 1 b03, 2 b04, 3 b08, 4 b11, 5 b12. Reflectance 0..1.
#   Default dates: 2021-12-14..15 (clear sky, day after the end of the eruption).
#   Try 2021-12-04..05: clouds and volcanic aerosols. S2 fails, S1 does not.
# Sentinel-1 RTC (descending, gamma0 linear power), loaded here, merged in as:
#   6 VV after, 7 VV before.
# Sentinel-2 reference (clear sky, after the eruption), loaded here, merged in as:
#   8 B3, 9 B11: a land / sea mask that works for any project date.
from openeo.processes import not_, or_

S1_ID = "sentinel-1-grd-rtc-acquisitions-staging"
S1_VV = "gamma0-rtc-backscatter-desc|bands=vv"
S1_POST = ["2021-12-03", "2021-12-04"]
S1_PRE = ["2021-09-10", "2021-09-11"]
S2_REF = ["2021-12-14", "2021-12-15"]

CHANGE_DB = 3  # S1: |VV after / before| above this (dB) is a change
HOT_B12 = 0.25  # S2: B12 above this, and 20% above B11, is hot lava (thermal emission)
SPECKLE = 5  # S1: mean filter (pixels) before the change, against the speckle
CLOUD_B2 = 0.2  # S2: B2 reflectance above this is cloud
WATER_MNDWI = 0.3  # S2 reference: MNDWI above this, and B3 below 0.1 (not a cloud), is water

DIM = metadata.band_dimension.name if metadata else "bands"


def load_s1(dates, name):
    # The project's area, with the S1 collection, dates and band.
    # S1 RTC has no eo:cloud_cover: remove the project's property filter.
    args = dict(load_collection_args)
    args.pop("properties", None)
    args.update({"id": S1_ID, "temporal_extent": dates, "bands": [S1_VV]})
    cube = DataCube(graph=PGNode("load_collection", **args))
    cube = cube.process("apply_pixel_selection", pixel_selection="first", data=cube)
    kernel = [[1] * SPECKLE for _ in range(SPECKLE)]
    cube = cube.apply_kernel(kernel=kernel, factor=1 / SPECKLE**2, border="reflect")
    return cube.rename_labels(dimension=DIM, target=[name])


def load_s2_reference(dates):
    # The project's collection, area and filters, with the reference dates and B3, B11.
    args = {**load_collection_args, "temporal_extent": dates, "bands": [default_bands[1], default_bands[4]]}
    cube = DataCube(graph=PGNode("load_collection", **args))
    cube = cube.process("apply_pixel_selection", pixel_selection="first", data=cube)
    return cube.rename_labels(dimension=DIM, target=["ref_b03", "ref_b11"])


fused = (
    reduced.merge_cubes(load_s1(S1_POST, "post_vv"))
    .merge_cubes(load_s1(S1_PRE, "pre_vv"))
    .merge_cubes(load_s2_reference(S2_REF))
)


def db(x):
    return process("log", x=x, base=10) * 10


def true_color(data, k=1.0):
    return [clip(data[2] * 3.5 * k, 0, 1), clip(data[1] * 3.5 * k, 0, 1), clip(data[0] * 3.5 * k, 0, 1)]


def s2_true_color(data):
    return array_create(true_color(data))


def s2_swir(data):
    # B12 / B11 / B4: hot lava is bright red-orange, cold lava is dark
    return array_create([clip(data[5] * 2.5, 0, 1), clip(data[4] * 2.5, 0, 1), clip(data[2] * 3, 0, 1)])


def paint(mask, color, rgb):
    one = rgb[0] * 0 + 1
    return [if_(mask, one * c, x) for c, x in zip(color, rgb)]


def lava_fusion(data):
    """S2 true colour, with:
    - grey S1 VV where S2 is cloud (S1 sees through clouds)
    - dark blue: sea, from the clear S2 reference (MNDWI, dark green: not a cloud)
    - red: S1 change on land, orange: S2 hot lava, yellow: both agree
    """
    cloud = data[0] > CLOUD_B2
    water = and_((data[8] - data[9]) / (data[8] + data[9]) > WATER_MNDWI, data[8] < 0.1)
    s1_change = and_(not_(water), process("absolute", x=db(data[6] / data[7])) > CHANGE_DB)
    hot = and_(data[5] > HOT_B12, data[5] > data[4] * 1.2)

    rgb = true_color(data)
    s1_grey = clip((db(data[6]) + 20) / 25, 0, 1)
    rgb = [if_(cloud, s1_grey, x) for x in rgb]
    rgb = paint(water, [0.05, 0.1, 0.2], rgb)
    rgb = paint(s1_change, [0.9, 0.1, 0.1], rgb)
    rgb = paint(hot, [1.0, 0.5, 0.0], rgb)
    rgb = paint(and_(hot, s1_change), [1.0, 1.0, 0.0], rgb)
    return array_create(rgb)


def s2_quality(data):
    """Magenta where the S2 L2A reflectance is not physically possible:
    - a negative value (e.g. over-correction in deep terrain shadow)
    - water (dark NIR, blue >> red) brighter in SWIR than in green
      (e.g. a failed atmospheric correction under volcanic aerosols)"""
    negative = or_(or_(data[0] < 0, data[1] < 0), data[2] < 0)
    water_like = and_(data[3] < 0.03, data[0] > data[2] * 1.5)
    bad = or_(negative, and_(water_like, data[4] > data[1]))
    return array_create(paint(bad, [1.0, 0.0, 1.0], true_color(data, 0.6)))


def layer(cube, fn, name):
    img = cube.apply_dimension(dimension=DIM, process=fn)
    img = img.linear_scale_range(input_min=0, input_max=1, output_min=0, output_max=255)
    add_graph_to_map(img.save_result("PNG"), name)


layer(reduced, s2_true_color, "S2 true colour")
layer(reduced, s2_swir, "S2 SWIR B12/B11/B4 (hot lava)")
layer(reduced, s2_quality, "S2 quality check (magenta: not possible)")
layer(fused, lava_fusion, "Lava fusion: S1 change (red), S2 hot (orange), both (yellow)")
