import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import {
  Box,
  Flex,
  Heading,
  Spinner,
  Switch,
  Text,
  VStack
} from '@chakra-ui/react';
import { useAuth } from 'react-oidc-context';
import Map, { MapRef } from 'react-map-gl/maplibre';
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
  const { user } = useAuth();
  const mapRef = useRef<MapRef>(null);
  const [service, setService] = useState<ServiceDetails | null>(null);
  const [tileUrl, setTileUrl] = useState<string | null>(null);
  const [layerVisible, setLayerVisible] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!serviceId) {
      setError('No service ID provided.');
      setIsLoading(false);
      return;
    }

    const fetchService = async () => {
      try {
        const response = await fetch(getServiceUrl(serviceId), {
          headers: {
            Authorization: `${AUTH_PREFIX}${user?.access_token}`
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
  }, [serviceId, user]);

  const onMapLoad = useCallback(() => {
    const extent = service?.configuration?.extent;
    if (
      mapRef.current &&
      Array.isArray(extent) &&
      extent.length === 4 &&
      extent.every((v) => typeof v === 'number')
    ) {
      const bounds = extent as [number, number, number, number];
      mapRef.current.fitBounds(bounds, { padding: 50, duration: 1000 });
    }
  }, [service]);

  if (isLoading) {
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
      <Flex flexGrow={1} position='relative'>
        <Map
          ref={mapRef}
          initialViewState={{
            longitude: 0,
            latitude: 0,
            zoom: 2
          }}
          onLoad={onMapLoad}
          style={{ flexGrow: 1 }}
          mapStyle={BASE_STYLE}
        >
          {tileUrl && layerVisible && (
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

        {/* Layer control */}
        {service && (
          <Box
            position='absolute'
            top={4}
            right={4}
            bg='bg'
            borderRadius='sm'
            p={3}
            minW={52}
            zIndex={1000}
          >
            <Text fontSize='sm' fontWeight='medium' mb={2}>
              Map Layers
            </Text>
            <Flex align='center' justify='space-between' py={1} px={2}>
              <Text
                fontSize='sm'
                color={layerVisible ? 'black' : 'gray.400'}
                lineClamp='1'
                flex={1}
              >
                {(service.configuration?.layerName as string) || service.title}
              </Text>
              <Switch.Root
                size='sm'
                checked={layerVisible}
                onCheckedChange={() => setLayerVisible((v) => !v)}
              >
                <Switch.HiddenInput />
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
              </Switch.Root>
            </Flex>
          </Box>
        )}
      </Flex>
    </Flex>
  );
}
