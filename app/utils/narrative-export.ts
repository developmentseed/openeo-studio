/**
 * Generates eodash narrative markdown for embedding a map layer.
 *
 * The format follows the eodash storytelling map configuration:
 * {@link https://github.com/eodash/eodash/blob/main/widgets/ExportState.vue}
 */
export function buildNarrativeMarkdown(options: {
  tileUrl: string;
  center: [number, number];
  zoom: number;
  layerName?: string;
}): string {
  const { tileUrl, center, zoom, layerName } = options;

  const id = layerName
    ? layerName.toLowerCase().replace(/\s+/g, '-')
    : 'openeo-layer';

  const layers = [
    {
      type: 'Tile',
      properties: { id },
      source: { type: 'XYZ', url: tileUrl }
    }
  ];

  return `### <!--{ layers='${JSON.stringify(layers)}' center=[${center[0]},${center[1]}] zoom=${zoom} animationOptions="{duration:500}" }-->`;
}
