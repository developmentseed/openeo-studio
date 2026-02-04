import { Flex } from '@chakra-ui/react';
import { useAuth } from 'react-oidc-context';
import { MapViewer } from '$components/map/map-viewer';
import { LoginDialog } from '$components/auth/login-dialog';
import type { ServiceInfo } from '$types';

interface MapPanelProps {
  bounds?: [number, number, number, number];
  services: ServiceInfo[];
  onToggleLayer: (serviceId: string) => void;
  onBoundingBoxChange: (boundingBox: [number, number, number, number]) => void;
}

export function MapPanel({
  bounds,
  services,
  onToggleLayer,
  onBoundingBoxChange
}: MapPanelProps) {
  const { isAuthenticated } = useAuth();

  return (
    <Flex flexGrow={1} h='100%' position='relative'>
      <Flex
        flexGrow={1}
        filter={!isAuthenticated ? 'blur(16px)' : undefined}
        pointerEvents={!isAuthenticated ? 'none' : 'auto'}
      >
        <MapViewer
          bounds={bounds}
          services={services}
          onToggleLayer={onToggleLayer}
          onBoundingBoxChange={onBoundingBoxChange}
        />
      </Flex>
      <LoginDialog isOpen={!isAuthenticated} />
    </Flex>
  );
}
