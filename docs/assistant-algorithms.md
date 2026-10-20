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
the MPC backend's `/validation`; all 19 were re-checked on 2026-10-20. None
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

**APEx (2)**, as a line calling `algorithm(url)`, which runs the published
process graph on the project's area, dates and cloud cover:

- **nddi** (Terravision): Normalized Difference Dust Index.
- **UHI_per_pixel** (Compass Informatics): urban heat island. The least
  certain, as it loads Landsat and land cover by STAC URL rather than as a
  collection.

## Cannot run in Studio ❌

| Reason | Algorithms |
|---|---|
| Needs 2–3 collections; a Studio project loads one | flood_detection, land_surface_temperature, olci_under_s5, s2_s1_forest_fire_progression, sand_oriented_land_cover_classification, ship_detection, urban_s1_s2 |
| No single step over the bands to take from the notebook (time series, composites, several steps) | agriculture_growth_stage, atmospheric_resistant_vegetation_index, cloudless_mosaic, flood_mapping, monthly_composite, multitemporal_burnt_area, ndvi_anomaly_detection, plant-senescence-reflectance-index, vegetation_condition_index |
| The notebook does not build (undefined variables) | lava_visualization, wildfire_visualization |
| An application package that runs elsewhere, not an openEO graph | sen4cap_l3_basic_markers, sen4cap_l3b_biophysical_indicators, sen4cap_l3b_spectral_indices, sen4cap_l4a_crop_type, sen4cap_l4b_grassland_mowing, sen4cap_l4c_agricultural_practices, sen4cap_l4d_bare_soil, sen4cap_l4e_parcel_heterogeneity, sen4cap_s1_pre_processing, gep_DinSAR, gep_api_ost, gep_bas, gep_ost, sar_coin, worldcereal_crop_extent, worldcereal_crop_type, efast, methane_detection, delineate_anything, solar_pv_detection, amwi, bsi, mogpr_s1s2, peakvalley, phenology, whittaker, world_agrocommodities |
| Uses processes the MPC backend lacks (UDFs, ML models, `any`, `quantiles`…) | force_level2, force_tsa, RAMONA-herbaceous_rangeland_biomass, wind_turbine_detection, scmap, eurac_pv_farm_detection, sentinel1_sar_coherence, sentinel1_sar_interferogram, sentinel1_sar_slc_preprocessing, sentinel1_changedetection, udp_obsgession_w23_lai, s2_sam, bap_composite, biopar, cropsar1d, cropsar2d, max_ndvi_composite, parcel_delineation, ppi, random_forest_firemapping, sentinel1_stats, timeseries_statistics, variabilitymap |
| Needs two time windows; Studio has one | sentinel1_soil_moisture |
| Needs polygons, not a bounding box | worldcover_statistics |
| Its graph link is a relative path, so it cannot be fetched | gfm_temporal_aggregation |

The first three rows are openeo-udp's (the 18 without code); the rest are
APEx's. gfm_temporal_aggregation may be fixable by resolving its link against
its record.

The reasons come from `scripts/build_catalogue.py` in the openeo-studio
toolset, which records one per algorithm as `why_not`; the assistant gives the
same reason when asked.
