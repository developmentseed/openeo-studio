import { Layer, Source } from 'react-map-gl/maplibre';
import type { ServiceInfo } from '../../utils/template-renderer';

interface MapLayersProps {
  services: ServiceInfo[];
}

export function MapLayers({ services }: MapLayersProps) {
  // Handle undefined services gracefully
  if (!services || !Array.isArray(services)) {
    return null;
  }

  return (
    <>
      {services.map((service, index) => (
        <Source
          key={service.id}
          id={`service-${service.id}`}
          type='raster'
          tiles={[decodeURIComponent(service.tileUrl)]}
          tileSize={256}
        >
          <Layer
            id={`layer-${service.id}`}
            type='raster'
            paint={{
              'raster-opacity': 0.8 - index * 0.1 // Slight transparency for overlays
            }}
          />
        </Source>
      ))}
    </>
  );
}
