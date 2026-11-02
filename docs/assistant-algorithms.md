# Assistant algorithms

Which published algorithms the Assistant can run in Studio, and why the rest
cannot. The catalogue holds the 35 algorithms from
[developmentseed/openeo-udp](https://github.com/developmentseed/openeo-udp)
and the 55 other providers' algorithms in the [APEx algorithm
catalogue](https://algorithm-catalogue.apex.esa.int/): 90 in all. The **Ours**
assistant knows only the 17 we wrote Studio code for; the **Everything**
assistant knows all 90 (see [assistant-prompts.md](assistant-prompts.md)).

## What "runs" means

An algorithm with code was built under Studio's loader and its graph passed
the MPC backend's `/validation`; all 17 were re-checked on 2026-10-20. None
has been rendered as map tiles in this check, which needs a login, and
`/validation` checks only the graph's shape. So 🟡 is "very likely runs", not
"definitely".

## Has code 🟡

**Ours (17)**, as Python on Studio's `reduced` cube:

apa_aquatic_plants_algae, bais2_burned_area, barren_soil,
cab_chlorophyll_content, cohen_braaten_yang_cloud_detection,
enhanced_vegetation_index, fapar, fire_boundary, hollstein_cloud_detection,
kernel_ndvi, leaf_area_index, mago_water_quality, ndsi, oil_spill_index,
snow_classifier, swbm, urban_areas

## Translated from the graph 🟡

Four APEx algorithms are published only as a process graph: a user-defined
process, not a standard openEO process. The backend cannot call a remote
user-defined process, so Studio needs the graph as Python. The assistant reads
the graph and writes the Python on Studio's `datacube` or `reduced`. The toolset
checks the code before it becomes a card. The model writes this code, so it can
change from one run to the next, and it is not checked here.

- **nddi** (Terravision): Normalized Difference Dust Index.
- **max_ndvi_composite** (VITO): the backend lacks `any`.
- **ppi** (VITO): the backend lacks `filter_spatial` and `vector_to_raster`.
- **sentinel1_stats** (VITO): the backend lacks `array_concat` and `quantiles`.

This needs the graph translation of
[openeo-studio-assistant#4](https://github.com/developmentseed/openeo-studio-assistant/pull/4).
Before it, the assistant cannot propose these four. A graph larger than 30,000
characters (`bap_composite`) is not given to the model.

When the backend lacks a standard process that a graph uses, the assistant can
write an equivalent, for example `x != x` for `is_nan(x)`, or a `max` of
booleans for `any`. When the equivalent is only an approximation, the card says
so. There is no equivalent for UDFs (`run_udf`), CWL (`run_cwl_to_stac`), ML
models (`load_ml_model`) or a backend's own processes (`cropsar2d`,
`bap_composite`, `force_tsa`…).

## Cannot run in Studio ❌

| Reason | Algorithms |
|---|---|
| Needs 2–3 collections; a Studio project loads one | flood_detection, land_surface_temperature, olci_under_s5, s2_s1_forest_fire_progression, sand_oriented_land_cover_classification, ship_detection, urban_s1_s2 |
| No single step over the bands to take from the notebook (time series, composites, several steps) | agriculture_growth_stage, atmospheric_resistant_vegetation_index, cloudless_mosaic, flood_mapping, monthly_composite, multitemporal_burnt_area, ndvi_anomaly_detection, plant-senescence-reflectance-index, vegetation_condition_index |
| The notebook does not build (undefined variables) | lava_visualization, wildfire_visualization |
| An application package that runs elsewhere, not an openEO graph | sen4cap_l3_basic_markers, sen4cap_l3b_biophysical_indicators, sen4cap_l3b_spectral_indices, sen4cap_l4a_crop_type, sen4cap_l4b_grassland_mowing, sen4cap_l4c_agricultural_practices, sen4cap_l4d_bare_soil, sen4cap_l4e_parcel_heterogeneity, sen4cap_s1_pre_processing, gep_DinSAR, gep_api_ost, gep_bas, gep_ost, sar_coin, worldcereal_crop_extent, worldcereal_crop_type, efast, methane_detection, delineate_anything, solar_pv_detection, amwi, bsi, mogpr_s1s2, peakvalley, phenology, whittaker, world_agrocommodities |
| Uses processes the MPC backend lacks (UDFs, ML models, `any`, `quantiles`…). Where the only missing processes are standard ones, the graph translation can make an algorithm run; the toolset gives the reasons again when its catalogue is rebuilt | force_level2, force_tsa, RAMONA-herbaceous_rangeland_biomass, wind_turbine_detection, scmap, eurac_pv_farm_detection, sentinel1_sar_coherence, sentinel1_sar_interferogram, sentinel1_sar_slc_preprocessing, sentinel1_changedetection, udp_obsgession_w23_lai, s2_sam, bap_composite, biopar, cropsar1d, cropsar2d, max_ndvi_composite, parcel_delineation, ppi, random_forest_firemapping, sentinel1_stats, timeseries_statistics, variabilitymap |
| Needs two time windows; Studio has one | sentinel1_soil_moisture |
| Loads its data by STAC URL, not from one collection | UHI_per_pixel |
| Needs polygons, not a bounding box | worldcover_statistics |
| Its graph link is a relative path, so it cannot be fetched | gfm_temporal_aggregation |

The first three rows are openeo-udp's (the 18 without code); the rest are
APEx's. gfm_temporal_aggregation may be fixable by resolving its link against
its record.

The reasons come from `scripts/build_catalogue.py` in the openeo-studio
toolset, which records one per algorithm as `why_not`; the assistant gives the
same reason when asked.
