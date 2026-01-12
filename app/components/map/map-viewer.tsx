import { useRef, useEffect } from 'react';
import Map, { MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

import { MapLayers } from './map-layers.js';
import { LayerControl } from './layer-control';
import type { ServiceInfo } from '$types';

const MAP_STYLE = `https://api.maptiler.com/maps/satellite/style.json?key=${import.meta.env.VITE_MAPTILER_KEY}`;

interface MapViewerProps {
  bounds?: [number, number, number, number];
  services: ServiceInfo[];
  onToggleLayer: (serviceId: string) => void;
}

export function MapViewer({ bounds, services, onToggleLayer }: MapViewerProps) {
  const mapRef = useRef<MapRef>(null);

  const applyFitBounds = () => {
    const map = mapRef.current;
    if (!map || !bounds) return;

    map.fitBounds(bounds, {
      padding: 50,
      duration: 1000
    });
  };

  // Apply fitBounds when bounds changes (or is done loading)
  useEffect(() => {
    applyFitBounds();
  }, [bounds]);

  return (
    <Map
      ref={mapRef}
      onLoad={applyFitBounds}
      initialViewState={{
        longitude: 0,
        latitude: 0,
        zoom: 2
      }}
      style={{ flexGrow: 1 }}
      mapStyle={MAP_STYLE}
    >
      <MapLayers services={services} />
      <LayerControl services={services} onToggleLayer={onToggleLayer} />
    </Map>
  );
}
