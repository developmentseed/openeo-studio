import { Flex } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useAuth } from 'react-oidc-context';
import { MapViewer } from '$components/map/map-viewer';
import { TileStatusAlert } from '$components/map/tile-status-alert';
import type { TileLoadStatus } from '$components/map/use-map-tile-status';
import { LoginDialog } from '$components/auth/login-dialog';
import type { ServiceInfo } from '$types';

interface MapPanelProps {
  bounds?: [number, number, number, number];
  sceneId: string | null;
  services: ServiceInfo[];
  onToggleLayer: (serviceId: string) => void;
  onBoundingBoxChange: (boundingBox: [number, number, number, number]) => void;
}

export function MapPanel({
  bounds,
  sceneId,
  services,
  onToggleLayer,
  onBoundingBoxChange
}: MapPanelProps) {
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
          onToggleLayer={onToggleLayer}
          onBoundingBoxChange={onBoundingBoxChange}
          onTileStatusChange={setTileStatus}
        />
      </Flex>
      {services.length > 0 && <TileStatusAlert status={tileStatus} />}
      <LoginDialog isOpen={!isAuthenticated} />
    </Flex>
  );
}
