import { useRef, useEffect } from 'react';
import Map, { MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapLayers } from './map-layers.js';
import type { StacItem } from 'stac-ts';

const MAP_STYLE = `https://api.maptiler.com/maps/satellite/style.json?key=${import.meta.env.VITE_MAPTILER_KEY}`;

interface MapViewerProps {
  item: StacItem | null;
  tileUrl: string | undefined;
}

export function MapViewer({ item, tileUrl }: MapViewerProps) {
  const mapRef = useRef<MapRef>(null);

  const applyFitBounds = () => {
    const map = mapRef.current;
    if (!map || !item?.bbox) return;

    map.fitBounds(item.bbox as unknown as [number, number, number, number], {
      padding: 50,
      duration: 1000
    });
  };

  // Apply fitBounds when item changes (or is done loading)
  useEffect(() => {
    applyFitBounds();
  }, [item?.id, item?.bbox]);

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
      <MapLayers item={item} tileUrl={tileUrl} />
    </Map>
  );
}
