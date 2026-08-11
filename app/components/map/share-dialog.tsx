import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  Flex,
  Heading,
  IconButton,
  Portal,
  RadioGroup,
  Separator,
  Span,
  Spinner,
  Stack,
  Text,
  VStack
} from '@chakra-ui/react';
import { useAuth } from 'react-oidc-context';
import { LuX } from 'react-icons/lu';

import { MapViewer } from '$components/map/map-viewer';
import { TileStatusAlert } from '$components/map/tile-status-alert';
import type { TileLoadStatus } from '$components/map/use-map-tile-status';
import {
  getServiceScope,
  type ServiceScope
} from '$components/services/service-scope-badge';
import { ShareHeader } from '$components/share/share-header';
import { Tip } from '$components/tooltip';
import type { BackendService, ServiceInfo } from '$types';
import { createPermanentService } from '$utils/openeo/permanent-services';
import {
  backendServiceToServiceInfo,
  getServiceDisplayName,
  getServiceExtent
} from '$utils/openeo/service-adapters';
import { toaster } from '$utils/toaster';

interface ShareDialogProps {
  service: ServiceInfo;
  bounds?: [number, number, number, number];
  onClose: () => void;
}

export function ShareDialog({ service, bounds, onClose }: ShareDialogProps) {
  const { user } = useAuth();
  const [scope, setScope] = useState<ServiceScope>('private');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<BackendService | null>(null);
  const [layerVisible, setLayerVisible] = useState(true);
  const [tileStatus, setTileStatus] = useState<TileLoadStatus>({
    pending: 0,
    status: 'idle'
  });

  const handleCreate = async () => {
    if (!user?.access_token) return;

    setIsCreating(true);
    setError(null);

    try {
      const result = await createPermanentService(
        service.graphResult,
        user.access_token,
        scope,
        bounds
      );
      setCreated(result);
      toaster.success({ title: 'Service created' });
    } catch (err) {
      toaster.error({
        title: 'Failed to create service',
        description:
          err instanceof Error
            ? err.message
            : 'An unknown error occurred while creating the service'
      });
    } finally {
      setIsCreating(false);
    }
  };

  const mapServices = useMemo(() => {
    if (!created) return [];
    return [
      backendServiceToServiceInfo(
        created,
        layerVisible,
        service.graphResult.name
      )
    ];
  }, [created, layerVisible, service.graphResult.name]);

  const previewBounds = created ? getServiceExtent(created, bounds) : bounds;
  const previewTitle = created
    ? getServiceDisplayName(created) || service.graphResult.name
    : service.graphResult.name;
  const previewScope = created ? getServiceScope(created.configuration) : scope;

  const handleScopeChanged = (nextScope: ServiceScope) => {
    setCreated((current) =>
      current
        ? {
            ...current,
            configuration: { ...current.configuration, scope: nextScope }
          }
        : current
    );
  };

  const handleToggleLayer = (id: string) => {
    if (created && id === created.id) {
      setLayerVisible((v) => !v);
    }
  };

  return (
    <Dialog.Root
      open
      onOpenChange={(details) => {
        if (!details.open) onClose();
      }}
    >
      <Dialog.Backdrop />
      <Portal>
        <Dialog.Positioner>
          <Dialog.Content
            maxW={created ? 'full' : 'md'}
            w={created ? '90vw' : undefined}
            h={created ? '85vh' : undefined}
            p={created ? 4 : 6}
            display='flex'
            flexDirection='column'
            minH={0}
          >
            {!created ? (
              <>
                <Dialog.Header p={0} mb={4}>
                  <Heading size='md'>Export as Permanent Service</Heading>
                </Dialog.Header>
                <Dialog.Body p={0}>
                  <VStack align='stretch' gap={4}>
                    <Text fontSize='sm' color='fg.muted'>
                      Create a permanent XYZ service for{' '}
                      <strong>{service.graphResult.name}</strong>.
                    </Text>
                    <Stack align='stretch' gap={2}>
                      <Text fontSize='sm' fontWeight='bold'>
                        Scope
                      </Text>
                      <RadioGroup.Root
                        size='sm'
                        value={scope}
                        onValueChange={(details) =>
                          setScope(details.value as ServiceScope)
                        }
                      >
                        <VStack align='stretch' gap={2}>
                          <Tip content='Coming soon...'>
                            <RadioGroup.Item
                              value='public'
                              justifyContent='space-between'
                              disabled
                            >
                              <RadioGroup.ItemHiddenInput />
                              <RadioGroup.ItemText opacity={0.5}>
                                Public{' '}
                                <Span fontStyle='italic' color='fg.muted'>
                                  (accessible without authentication)
                                </Span>
                              </RadioGroup.ItemText>
                              <RadioGroup.ItemIndicator />
                            </RadioGroup.Item>
                          </Tip>
                          <RadioGroup.Item
                            value='private'
                            justifyContent='space-between'
                          >
                            <RadioGroup.ItemHiddenInput />
                            <RadioGroup.ItemText>
                              Private{' '}
                              <Span fontStyle='italic' color='fg.muted'>
                                (requires authentication)
                              </Span>
                            </RadioGroup.ItemText>
                            <RadioGroup.ItemIndicator />
                          </RadioGroup.Item>
                        </VStack>
                      </RadioGroup.Root>
                    </Stack>
                    {error && (
                      <Text fontSize='sm' color='fg.error'>
                        {error}
                      </Text>
                    )}
                    <Flex justify='flex-end' gap={2}>
                      <Button variant='ghost' size='sm' onClick={onClose}>
                        Cancel
                      </Button>
                      <Button
                        size='sm'
                        onClick={handleCreate}
                        disabled={isCreating}
                      >
                        {isCreating ? <Spinner size='sm' /> : 'Create'}
                      </Button>
                    </Flex>
                  </VStack>
                </Dialog.Body>
              </>
            ) : (
              <Dialog.Body
                p={0}
                flex={1}
                display='flex'
                flexDirection='column'
                minH={0}
                gap={3}
              >
                <Flex align='center' justify='space-between' gap={3} minW={0}>
                  <Box flex={1} minW={0}>
                    <ShareHeader
                      portalled={false}
                      actions={
                        <>
                          <Separator orientation='vertical' height={4} />
                          <IconButton
                            size='xs'
                            variant='ghost'
                            onClick={onClose}
                          >
                            <LuX />
                          </IconButton>
                        </>
                      }
                      title={previewTitle}
                      scope={previewScope}
                      service={created}
                      onScopeChanged={handleScopeChanged}
                      onDeleted={onClose}
                    />
                  </Box>
                </Flex>

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
                    sceneId={created.id}
                    bounds={previewBounds}
                    services={mapServices}
                    onToggleLayer={handleToggleLayer}
                    onTileStatusChange={setTileStatus}
                  />
                  {mapServices.length > 0 && (
                    <TileStatusAlert status={tileStatus} />
                  )}
                </Flex>
              </Dialog.Body>
            )}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
