import { Flex } from '@chakra-ui/react';
import { MapViewer } from '$components/map/map-viewer';
import type { StacItem } from 'stac-ts';
import type { ServiceInfo } from '$types';

interface MapPanelProps {
  item: StacItem | null;
  services: ServiceInfo[];
  onToggleLayer: (serviceId: string) => void;
}

export function MapPanel({ item, services, onToggleLayer }: MapPanelProps) {
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
          item={item}
          services={services}
          onToggleLayer={onToggleLayer}
        />
      </Flex>
    </Flex>
  );
}
