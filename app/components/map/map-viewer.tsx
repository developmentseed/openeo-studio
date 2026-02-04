import { useRef, useEffect, useState } from 'react';
import Map, { MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

import { MapLayers } from './map-layers.js';
import { LayerControl } from './layer-control';
import { BaseLayerControl } from './base-layer-control.js';
import type { ServiceInfo } from '$types';
import { MAPTILER_KEY } from '$config/constants.js';

const BASE_LAYERS = [
  {
    id: 'satellite',
    label: 'Satellite',
    styleUrl: `https://api.maptiler.com/maps/satellite/style.json?key=${MAPTILER_KEY}`
  },
  {
    id: 'streets',
    label: 'Streets',
    styleUrl: `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`
  },
  {
    id: 'topographic',
    label: 'Topographic',
    styleUrl: `https://api.maptiler.com/maps/topo-v2/style.json?key=${MAPTILER_KEY}`
  }
];

interface MapViewerProps {
  bounds?: [number, number, number, number];
  services: ServiceInfo[];
  onToggleLayer: (serviceId: string) => void;
  onBoundingBoxChange: (boundingBox: [number, number, number, number]) => void;
}

export function MapViewer({
  bounds,
  services,
  onToggleLayer,
  onBoundingBoxChange
}: MapViewerProps) {
  const mapRef = useRef<MapRef>(null);
  const [baseLayerId, setBaseLayerId] = useState(BASE_LAYERS[0]?.id ?? '');
  const activeBaseLayer =
    BASE_LAYERS.find((layer) => layer.id === baseLayerId) ?? BASE_LAYERS[0];

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
      onMoveEnd={() => {
        const map = mapRef.current;
        if (!map) return;
        const bounds = map.getBounds();
        onBoundingBoxChange([
          bounds.getWest(),
          bounds.getSouth(),
          bounds.getEast(),
          bounds.getNorth()
        ]);
      }}
      reuseMaps
      initialViewState={{
        longitude: 0,
        latitude: 0,
        zoom: 2
      }}
      style={{ flexGrow: 1 }}
      mapStyle={activeBaseLayer.styleUrl}
    >
      <MapLayers services={services} />
      <BaseLayerControl
        options={BASE_LAYERS}
        value={baseLayerId}
        onChange={setBaseLayerId}
      />
      <LayerControl services={services} onToggleLayer={onToggleLayer} />
    </Map>
  );
}
