import type { CollectionQueryables } from '$utils/openeo/queryables';

/**
 * Queryables of `sentinel-2-l2a`, as returned by
 * https://openeo.mpc.ds.io/collections/sentinel-2-l2a/queryables (`properties`).
 */
export const SENTINEL_2_QUERYABLES = {
  'proj:epsg': {
    type: ['integer', 'null'],
    title: 'EPSG code'
  },
  instruments: {
    type: 'array'
  },
  end_datetime: {
    type: 'string',
    title: 'End datetime',
    format: 'date-time',
    pattern: '(\\+00:00|Z)$',
    description: 'End datetime'
  },
  's2:mgrs_tile': {
    type: 'string',
    title: 'MGRS Tile'
  },
  constellation: {
    type: 'string'
  },
  's2:granule_id': {
    type: 'string',
    title: 'Granule ID'
  },
  'eo:cloud_cover': {
    $ref: 'https://stac-extensions.github.io/eo/v1.0.0/schema.json#/definitions/fields/properties/eo:cloud_cover'
  },
  's2:datatake_id': {
    type: 'string'
  },
  's2:product_uri': {
    type: 'string',
    title: 'Product URI'
  },
  start_datetime: {
    type: 'string',
    title: 'Start datetime',
    format: 'date-time',
    pattern: '(\\+00:00|Z)$',
    description: 'Start datetime'
  },
  's2:datastrip_id': {
    type: 'string'
  },
  's2:product_type': {
    enum: ['S2MSI2A'],
    type: 'string',
    title: 'Product Type'
  },
  'sat:orbit_state': {
    enum: ['ascending', 'descending', 'geostationary'],
    type: 'string',
    title: 'Orbit State'
  },
  's2:datatake_type': {
    enum: [
      'INS-ABSR',
      'INS-DASC',
      'INS-EOBS',
      'INS-NOBS',
      'INS-RAW',
      'INS-TST',
      'INS-VIC'
    ],
    type: 'string',
    title: 'Datatake Type'
  },
  's2:generation_time': {
    type: 'string'
  },
  'sat:relative_orbit': {
    $ref: 'https://stac-extensions.github.io/sat/v1.0.0/schema.json#/definitions/fields/properties/sat:relative_orbit',
    title: 'Relative Orbit'
  },
  's2:water_percentage': {
    type: 'number',
    title: 'Water Pct.',
    maximum: 100,
    minimum: 0
  },
  's2:mean_solar_zenith': {
    type: 'number',
    title: 'Mean Solar Zenith'
  },
  's2:mean_solar_azimuth': {
    type: 'number',
    title: 'Mean Solar Azimuth'
  },
  's2:processing_baseline': {
    type: 'string'
  },
  's2:snow_ice_percentage': {
    type: 'number',
    title: 'Snow/Ice Pct.',
    maximum: 100,
    minimum: 0
  },
  's2:vegetation_percentage': {
    type: 'number',
    title: 'Vegetation Pct.',
    maximum: 100,
    minimum: 0
  },
  's2:thin_cirrus_percentage': {
    type: 'number',
    title: 'Thin Cirrus Pct.',
    maximum: 100,
    minimum: 0
  },
  's2:cloud_shadow_percentage': {
    type: 'number',
    title: 'Cloud Shadow Pct.',
    maximum: 100,
    minimum: 0
  },
  's2:nodata_pixel_percentage': {
    type: 'number',
    title: 'NoData Pct.',
    maximum: 100,
    minimum: 0
  },
  's2:unclassified_percentage': {
    type: 'number'
  },
  's2:dark_features_percentage': {
    type: 'number',
    title: 'Dark Features Pct.',
    maximum: 100,
    minimum: 0
  },
  's2:not_vegetated_percentage': {
    type: 'number',
    title: 'Not Vegetated Pct.',
    maximum: 100,
    minimum: 0
  },
  's2:degraded_msi_data_percentage': {
    type: 'number'
  },
  's2:high_proba_clouds_percentage': {
    type: 'number'
  },
  's2:reflectance_conversion_factor': {
    type: 'number'
  },
  's2:medium_proba_clouds_percentage': {
    type: 'number'
  },
  's2:saturated_defective_pixel_percentage': {
    type: 'number'
  }
} as CollectionQueryables;
