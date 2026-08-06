import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Box, Flex, Spinner, Stack, Text, VStack } from '@chakra-ui/react';
import { useAuth } from 'react-oidc-context';

import type { BackendService } from '$types';
import { MapViewer } from '$components/map/map-viewer';
import { TileStatusAlert } from '$components/map/tile-status-alert';
import type { TileLoadStatus } from '$components/map/use-map-tile-status';
import {
  getServiceScope,
  type ServiceScope
} from '$components/services/service-scope-badge';
import { ShareHeader } from '$components/share/share-header';
import { APIError, fetchJson } from '$utils/api';
import {
  backendServiceToServiceInfo,
  getServiceDisplayName,
  getServiceExtent
} from '$utils/openeo/service-adapters';
import { getServiceUrl } from '$utils/openeo/services';
import { LuMapPinOff } from 'react-icons/lu';

export function SharePage() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [service, setService] = useState<BackendService | null>(null);
  const [layerVisible, setLayerVisible] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tileStatus, setTileStatus] = useState<TileLoadStatus>({
    pending: 0,
    status: 'idle'
  });

  useEffect(() => {
    if (!serviceId) {
      setError('No service ID provided.');
      setIsLoading(false);
      return;
    }

    const loadService = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const details = await fetchJson<BackendService>(
          getServiceUrl(serviceId),
          user?.access_token
        );
        setService(details);
        setLayerVisible(true);
      } catch (err) {
        if (err instanceof APIError && err.code === 404) {
          setError('Service not found. It may have been deleted.');
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Unable to connect to the service.');
        }
        setService(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadService();
  }, [serviceId, user?.access_token]);

  const services = useMemo(() => {
    if (!service) return [];
    return [backendServiceToServiceInfo(service, layerVisible)];
  }, [service, layerVisible]);

  const bounds = service ? getServiceExtent(service) : undefined;
  const title = service ? getServiceDisplayName(service) : 'Shared service';
  const scope = service ? getServiceScope(service.configuration) : 'public';

  const handleToggleLayer = (id: string) => {
    if (service && id === service.id) {
      setLayerVisible((v) => !v);
    }
  };

  const handleScopeChanged = (nextScope: ServiceScope) => {
    setService((current) =>
      current
        ? {
            ...current,
            configuration: { ...current.configuration, scope: nextScope }
          }
        : current
    );
  };

  return (
    <Box flex={1} display='flex' flexDirection='column' minH={0}>
      <Stack h='100%' gap={4} flex={1} minH={0}>
        <ShareHeader
          title={title}
          scope={scope}
          service={service}
          onScopeChanged={handleScopeChanged}
          onDeleted={() => navigate('/services')}
        />

        <Flex px={2} flex={1} minH={0} justifyContent='stretch'>
          {isLoading ? (
            <Flex w='100%' align='center' justify='center'>
              <VStack gap={4}>
                <Spinner size='lg' />
                <Text fontWeight='semibold' fontSize='lg'>
                  Loading service…
                </Text>
              </VStack>
            </Flex>
          ) : error ? (
            <Box
              borderWidth='2px'
              borderStyle='dashed'
              borderColor='border'
              borderRadius='uni'
              bg='bg'
              p={6}
              boxSize='100%'
            >
              <VStack gap={2} justify='center' height='100%'>
                <LuMapPinOff size='4rem' />
                <VStack gap={2}>
                  <Text fontWeight='semibold' fontSize='lg'>
                    Service Unavailable
                  </Text>
                  <Text fontSize='sm' textAlign='center'>
                    {error}
                  </Text>
                </VStack>
              </VStack>
            </Box>
          ) : (
            <Flex
              flex={1}
              minH={0}
              w='100%'
              position='relative'
              borderWidth='1px'
              borderColor='border'
              borderRadius='uni'
              overflow='hidden'
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
                sceneId={service?.id ?? null}
                bounds={bounds}
                services={services}
                onToggleLayer={handleToggleLayer}
                onTileStatusChange={setTileStatus}
              />
              {services.length > 0 && <TileStatusAlert status={tileStatus} />}
            </Flex>
          )}
        </Flex>
      </Stack>
    </Box>
  );
}
