import { Layer, Source } from 'react-map-gl/maplibre';

interface MapLayersProps {
  tileUrl: string | undefined;
}

export function MapLayers({ tileUrl }: MapLayersProps) {
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
    </>
  );
}
