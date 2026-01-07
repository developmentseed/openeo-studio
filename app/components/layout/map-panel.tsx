import { Flex } from '@chakra-ui/react';
import { MapViewer } from '$components/map/map-viewer';
import type { StacItem } from 'stac-ts';
import type { ServiceInfo } from '../../utils/template-renderer';

interface MapPanelProps {
  item: StacItem | null;
  services: ServiceInfo[];
}

export function MapPanel({ item, services }: MapPanelProps) {
  return (
    <Flex flexGrow={1} h='100%'>
      <Flex
        m={2}
        flexGrow={1}
        layerStyle='handDrawn'
        overflow='hidden'
        border='2px solid {colors.base.300a}'
      >
        <MapViewer item={item} services={services} />
      </Flex>
    </Flex>
  );
}
