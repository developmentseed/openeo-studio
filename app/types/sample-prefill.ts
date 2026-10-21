/**
 * A sample that an external link loads into the editor.
 *
 * An agent writes this document, encodes it, and gives the user the link
 * `/editor?sample=<base64url(JSON)>` or `/editor?sampleUrl=<https URL>`.
 * Studio loads it as a new unsaved project and never runs it on its own.
 *
 * `scripts/generate-sample-schema.mjs` writes the JSON Schema of this type.
 * Studio publishes the schema at `agents/sample.schema.json`.
 */
/**
 * A date, `YYYY-MM-DD`.
 *
 * @pattern ^\d{4}-\d{2}-\d{2}$
 */
export type SampleDate = string;

/**
 * A band name of the collection, for example `B04` or
 * `reflectance|bands=b04`.
 *
 * @minLength 1
 */
export type SampleBand = string;

/**
 * @minimum -180
 * @maximum 180
 */
export type SampleLongitude = number;

/**
 * @minimum -90
 * @maximum 90
 */
export type SampleLatitude = number;

export interface SamplePrefill {
  /** The JSON Schema of this document. Studio ignores it. */
  $schema?: string;
  /** The project name that the editor shows. */
  name?: string;
  /**
   * The Python script. Studio runs it after `loader.py`, which defines
   * `datacube`, `reduced` and `add_graph_to_map`. Read
   * `agents/script-contract.md`.
   *
   * @minLength 1
   * @maxLength 100000
   */
  code: string;
  /**
   * The id of a collection of the openEO backend.
   *
   * @minLength 1
   */
  collectionId: string;
  /** Start and end date, `YYYY-MM-DD`. */
  temporalRange: [SampleDate, SampleDate];
  /**
   * The band ids of the collection, for example `reflectance|bands=b04`.
   * The script reads `data[i]` in this order.
   *
   * @minItems 1
   */
  bands: SampleBand[];
  /**
   * west, south, east, north in EPSG:4326 degrees. Longitudes are from -180
   * to 180, latitudes from -90 to 90, and south is not more than north.
   */
  boundingBox?: [
    SampleLongitude,
    SampleLatitude,
    SampleLongitude,
    SampleLatitude
  ];
  /**
   * The maximum cloud cover in percent (filter `eo:cloud_cover < cloudCover`).
   * Without it, there is no cloud cover filter.
   *
   * @minimum 0
   * @maximum 100
   */
  cloudCover?: number;
}
