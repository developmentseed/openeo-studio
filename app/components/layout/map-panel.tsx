import { Flex } from '@chakra-ui/react';
import { MapViewer } from '$components/map/map-viewer';
import type { StacItem } from 'stac-ts';

interface MapPanelProps {
  item: StacItem | null;
  tileUrl: string | undefined;
}

export function MapPanel({ item, tileUrl }: MapPanelProps) {
  return (
    <Flex flexGrow={1} h='100%' minWidth='50%'>
      <Flex
        m={2}
        flexGrow={1}
        layerStyle='handDrawn'
        overflow='hidden'
        border='2px solid {colors.base.300a}'
      >
        <MapViewer item={item} tileUrl={tileUrl} />
      </Flex>
    </Flex>
  );
}
