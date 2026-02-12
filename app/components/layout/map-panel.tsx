import { Flex } from '@chakra-ui/react';
import { useEffect, useState, memo } from 'react';
import { useAuth } from 'react-oidc-context';
import { useShallow } from 'zustand/shallow';
import { MapViewer } from '$components/map/map-viewer';
import { TileStatusAlert } from '$components/map/tile-status-alert';
import type { TileLoadStatus } from '$components/map/use-map-tile-status';
import { LoginDialog } from '$components/auth/login-dialog';
import { useEditorStore } from '$stores/editor-store';

function MapPanelComponent() {
  const { bounds, sceneId, services } = useEditorStore(
    useShallow((state) => ({
      bounds: state.boundingBox,
      sceneId: state.sceneId,
      services: state.services
    }))
  );
  const { toggleServiceVisibility, setBoundingBox } = useEditorStore();

  const { isAuthenticated } = useAuth();
  const [tileStatus, setTileStatus] = useState<TileLoadStatus>({
    pending: 0,
    status: 'idle'
  });

  useEffect(() => {
    if (services.length === 0 && tileStatus.status !== 'idle') {
      setTileStatus({ pending: 0, status: 'idle' });
    }
  }, [services.length, tileStatus.status]);

  return (
    <Flex flexGrow={1} h='100%' position='relative'>
      <Flex
        flexGrow={1}
        filter={!isAuthenticated ? 'blur(16px)' : undefined}
        pointerEvents={!isAuthenticated ? 'none' : 'auto'}
      >
        <MapViewer
          bounds={bounds}
          sceneId={sceneId}
          services={services}
          onToggleLayer={toggleServiceVisibility}
          onBoundingBoxChange={setBoundingBox}
          onTileStatusChange={setTileStatus}
        />
      </Flex>
      {services.length > 0 && <TileStatusAlert status={tileStatus} />}
      <LoginDialog isOpen={!isAuthenticated} />
    </Flex>
  );
}

export const MapPanel = memo(MapPanelComponent);
