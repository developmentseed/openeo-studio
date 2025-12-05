import { Layer, Source } from 'react-map-gl/maplibre';
import type { StacItem } from 'stac-ts';

interface MapLayersProps {
  item: StacItem | null;
  tileUrl: string | undefined;
}

export function MapLayers({ item, tileUrl }: MapLayersProps) {
  return (
    <>
      {tileUrl && (
        <Source
          type='raster'
          tiles={[decodeURIComponent(tileUrl)]}
          tileSize={256}
        >
          <Layer type='raster' />
        </Source>
      )}
      {item && (
        <Source
          id='geometry'
          type='geojson'
          data={item as unknown as GeoJSON.Feature}
        >
          <Layer
            id='geometry-outline'
            type='line'
            paint={{
              'line-color': '#FF0000',
              'line-width': 2,
              'line-opacity': 0.8
            }}
          />
        </Source>
      )}
    </>
  );
}
