import { Flex } from '@chakra-ui/react';
import { MapViewer } from '$components/map/map-viewer';
import type { ServiceInfo } from '$types';

interface MapPanelProps {
  bounds?: [number, number, number, number];
  services: ServiceInfo[];
  onToggleLayer: (serviceId: string) => void;
}

export function MapPanel({ bounds, services, onToggleLayer }: MapPanelProps) {
  return (
    <Flex flexGrow={1} h='100%'>
      <Flex
        m={2}
        flexGrow={1}
        overflow='hidden'
        border='2px solid {colors.base.300a}'
      >
        <MapViewer
          bounds={bounds}
          services={services}
          onToggleLayer={onToggleLayer}
        />
      </Flex>
    </Flex>
  );
}
