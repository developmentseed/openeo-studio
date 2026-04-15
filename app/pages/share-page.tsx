import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { Flex, Heading, Spinner, Text, VStack } from '@chakra-ui/react';
import { useAuth } from 'react-oidc-context';
import Map from 'react-map-gl/maplibre';
import { Layer, Source } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

import { MAPTILER_KEY } from '$config/constants';
import { getServiceUrl } from '../utils/code-runner';

const AUTH_PREFIX = 'Bearer oidc/oidc/';
const BASE_STYLE = `https://api.maptiler.com/maps/satellite/style.json?key=${MAPTILER_KEY}`;

interface ServiceDetails {
  id: string;
  title: string;
  url: string;
  type: string;
  configuration: Record<string, unknown>;
}

export function SharePage() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [service, setService] = useState<ServiceDetails | null>(null);
  const [tileUrl, setTileUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !user?.access_token) {
      setError('You must be signed in to view shared services.');
      setIsLoading(false);
      return;
    }

    if (!serviceId) {
      setError('No service ID provided.');
      setIsLoading(false);
      return;
    }

    const fetchService = async () => {
      try {
        const response = await fetch(getServiceUrl(serviceId), {
          headers: {
            Authorization: `${AUTH_PREFIX}${user.access_token}`
          }
        });

        if (response.status === 404) {
          setError('Service not found. It may have been deleted.');
          return;
        }

        if (!response.ok) {
          setError(`Failed to load service (${response.status}).`);
          return;
        }

        const details = (await response.json()) as ServiceDetails;
        setService(details);
        setTileUrl(decodeURIComponent(details.url));
      } catch {
        setError('Unable to connect to the service.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchService();
  }, [serviceId, authLoading, isAuthenticated, user]);

  if (authLoading || isLoading) {
    return (
      <Flex h='100%' align='center' justify='center'>
        <VStack gap={4}>
          <Spinner size='lg' />
          <Text fontSize='sm' color='gray.500'>
            Loading service…
          </Text>
        </VStack>
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex h='100%' align='center' justify='center'>
        <VStack gap={4} maxW='sm' textAlign='center'>
          <Heading size='md'>Service Unavailable</Heading>
          <Text fontSize='sm' color='gray.600'>
            {error}
          </Text>
        </VStack>
      </Flex>
    );
  }

  return (
    <Flex flexGrow={1} h='100%' direction='column'>
      {service && (
        <Flex px={4} py={2} bg='bg' borderBottomWidth='1px' align='center'>
          <Text fontSize='sm' fontWeight='medium'>
            {service.title}
          </Text>
        </Flex>
      )}
      <Flex flexGrow={1}>
        <Map
          initialViewState={{
            longitude: 0,
            latitude: 0,
            zoom: 6
          }}
          style={{ flexGrow: 1 }}
          mapStyle={BASE_STYLE}
        >
          {tileUrl && (
            <Source
              id='shared-service'
              type='raster'
              tiles={[tileUrl]}
              tileSize={256}
              minzoom={6}
              maxzoom={15}
            >
              <Layer
                id='shared-layer'
                type='raster'
                paint={{ 'raster-opacity': 0.8 }}
              />
            </Source>
          )}
        </Map>
      </Flex>
    </Flex>
  );
}
