import { Flex } from '@chakra-ui/react';
import { useEffect, useState, memo } from 'react';
import { useShallow } from 'zustand/shallow';
import { MapViewer } from '$components/map/map-viewer';
import { TileStatusAlert } from '$components/map/tile-status-alert';
import type { TileLoadStatus } from '$components/map/use-map-tile-status';
import { ShareDialog } from '$components/map/share-dialog';
import { useEditorStore } from '$stores/editor-store';
import type { ServiceInfo } from '$types';

function MapPanelComponent() {
  const { bounds, sceneId, services } = useEditorStore(
    useShallow((state) => ({
      bounds: state.selectedConfig.boundingBox,
      sceneId: state.sceneId,
      services: state.services
    }))
  );
  const { toggleServiceVisibility, setBoundingBox } = useEditorStore();

  const [tileStatus, setTileStatus] = useState<TileLoadStatus>({
    pending: 0,
    status: 'idle'
  });
  const [shareService, setShareService] = useState<ServiceInfo | null>(null);

  useEffect(() => {
    if (services.length === 0 && tileStatus.status !== 'idle') {
      setTileStatus({ pending: 0, status: 'idle' });
    }
  }, [services.length, tileStatus.status]);

  return (
    <Flex flexGrow={1} h='100%' position='relative'>
      <Flex
        flexGrow={1}
        css={{
          '& .maplibregl-canvas-container': {
            position: 'relative',
            h: '100%',
            borderRadius: 'uni',
            overflow: 'hidden'
          }
        }}
      >
        <MapViewer
          bounds={bounds}
          sceneId={sceneId}
          services={services}
          onToggleLayer={toggleServiceVisibility}
          onBoundingBoxChange={setBoundingBox}
          onTileStatusChange={setTileStatus}
          onShareService={setShareService}
        />
      </Flex>
      {services.length > 0 && <TileStatusAlert status={tileStatus} />}
      {shareService && (
        <ShareDialog
          service={shareService}
          bounds={bounds}
          onClose={() => setShareService(null)}
        />
      )}
    </Flex>
  );
}

export const MapPanel = memo(MapPanelComponent);
