import { Flex } from '@chakra-ui/react';
import { MapViewer } from '$components/map/map-viewer';
import type { ServiceInfo } from '$types';

interface MapPanelProps {
  bbox: { west: number; south: number; east: number; north: number } | null;
  services: ServiceInfo[];
  onToggleLayer: (serviceId: string) => void;
}

export function MapPanel({ bbox, services, onToggleLayer }: MapPanelProps) {
  return (
    <Flex flexGrow={1} h='100%'>
      <Flex
        m={2}
        flexGrow={1}
        layerStyle='handDrawn'
        overflow='hidden'
        border='2px solid {colors.base.300a}'
      >
        <MapViewer
          bbox={bbox}
          services={services}
          onToggleLayer={onToggleLayer}
        />
      </Flex>
    </Flex>
  );
}
