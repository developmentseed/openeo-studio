import { useRef, useEffect, useState } from 'react';
import Map, { MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

import { MapLayers } from './map-layers';
import { MapLayerSelector } from './map-layer-selector';
import { useMapTileStatus, type TileLoadStatus } from './use-map-tile-status';
import type { ServiceInfo } from '$types';
import { MAPTILER_KEY } from '$config/constants';
import { useColorModeValue } from '$contexts/color-mode';

const makeMaptilerStyleUrl = (key: string) => {
  return `https://api.maptiler.com/maps/${key}/style.json?key=${MAPTILER_KEY}`;
};

const BASE_LAYERS = [
  {
    id: 'satellite',
    label: 'Satellite',
    styleUrl: {
      light: makeMaptilerStyleUrl('satellite-v4'),
      dark: makeMaptilerStyleUrl('satellite-v4-dark')
    }
  },
  {
    id: 'streets',
    label: 'Streets',
    styleUrl: {
      light: makeMaptilerStyleUrl('streets-v4'),
      dark: makeMaptilerStyleUrl('streets-v4-dark')
    }
  },
  {
    id: 'topographic',
    label: 'Topographic',
    styleUrl: {
      light: makeMaptilerStyleUrl('topo-v4'),
      dark: makeMaptilerStyleUrl('topo-v4-dark')
    }
  }
];

interface MapViewerProps {
  bounds?: [number, number, number, number];
  sceneId: string | null;
  services: ServiceInfo[];
  onToggleLayer: (serviceId: string) => void;
  onBoundingBoxChange?: (boundingBox: [number, number, number, number]) => void;
  onTileStatusChange?: (status: TileLoadStatus) => void;
  onServicePublish?: (service: ServiceInfo) => void;
}

export function MapViewer({
  bounds,
  sceneId,
  services,
  onToggleLayer,
  onBoundingBoxChange,
  onTileStatusChange,
  onServicePublish
}: MapViewerProps) {
  const mapRef = useRef<MapRef>(null);
  const [baseLayerId, setBaseLayerId] = useState(BASE_LAYERS[0]?.id ?? '');
  const activeBaseLayer =
    BASE_LAYERS.find((layer) => layer.id === baseLayerId) ?? BASE_LAYERS[0];
  const [isMapReady, setIsMapReady] = useState(false);
  const activeBaseLayerStyleUrl = useColorModeValue(
    activeBaseLayer.styleUrl.light,
    activeBaseLayer.styleUrl.dark
  );

  const applyFitBounds = () => {
    const map = mapRef.current;
    if (!map || !bounds) return;

    map.fitBounds(bounds, {
      padding: 50,
      duration: 1000
    });
  };

  // Apply fitBounds only when scene changes, not on viewport updates
  useEffect(() => {
    if (!isMapReady) return;
    applyFitBounds();
  }, [sceneId, isMapReady]);

  useMapTileStatus({
    mapRef,
    isMapReady,
    serviceCount: services.length,
    onStatusChange: onTileStatusChange
  });

  return (
    <Map
      ref={mapRef}
      onLoad={() => {
        applyFitBounds();
        setIsMapReady(true);
      }}
      onMoveEnd={(event) => {
        // Skip if programmatic move
        if (!event.originalEvent || !onBoundingBoxChange) return;

        const map = mapRef.current;
        if (!map) return;
        const nextBounds = map.getBounds();
        onBoundingBoxChange([
          nextBounds.getWest(),
          nextBounds.getSouth(),
          nextBounds.getEast(),
          nextBounds.getNorth()
        ]);
      }}
      reuseMaps
      initialViewState={{
        longitude: 0,
        latitude: 0,
        zoom: 2
      }}
      style={{ flexGrow: 1 }}
      mapStyle={activeBaseLayerStyleUrl}
    >
      <MapLayers services={services} />
      <MapLayerSelector
        services={services}
        onToggleLayer={onToggleLayer}
        onServicePublish={onServicePublish}
        baseOptions={BASE_LAYERS}
        baseValue={baseLayerId}
        onBaseChange={setBaseLayerId}
      />
    </Map>
  );
}
