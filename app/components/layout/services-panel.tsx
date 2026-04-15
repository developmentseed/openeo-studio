import { useEffect, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Clipboard,
  Dialog,
  Flex,
  Heading,
  IconButton,
  Spinner,
  Text,
  VStack
} from '@chakra-ui/react';
import { useAuth } from 'react-oidc-context';

import {
  deleteOpenEOService,
  getServiceUrl,
  listPermanentServices
} from '../../utils/code-runner';
import type { BackendService } from '$types';

function TrashIcon() {
  return (
    <svg viewBox='0 0 16 16' width='14' height='14' fill='currentColor'>
      <path d='M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z' />
      <path
        fillRule='evenodd'
        d='M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z'
      />
    </svg>
  );
}

interface ServicesPanelProps {
  open: boolean;
  onClose: () => void;
}

export function ServicesPanel({ open, onClose }: ServicesPanelProps) {
  const { user } = useAuth();
  const [services, setServices] = useState<BackendService[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open || !user?.access_token) return;

    const fetchServices = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await listPermanentServices(user.access_token);
        setServices(result);
      } catch {
        setError('Failed to load services.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, [open, user?.access_token]);

  const handleDelete = async (service: BackendService) => {
    if (!user?.access_token) return;

    setDeletingIds((prev) => new Set([...prev, service.id]));

    try {
      await deleteOpenEOService(getServiceUrl(service.id), user.access_token);
      setServices((prev) => prev.filter((s) => s.id !== service.id));
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(service.id);
        return next;
      });
    }
  };

  const getScope = (service: BackendService): string => {
    const config = service.configuration;
    return typeof config?.scope === 'string' ? config.scope : 'public';
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        if (!details.open) onClose();
      }}
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content maxW='lg' p={6} maxH='80vh'>
          <Dialog.CloseTrigger />
          <Dialog.Header p={0} mb={4}>
            <Heading size='md'>Permanent Services</Heading>
          </Dialog.Header>
          <Dialog.Body p={0} overflowY='auto'>
            {isLoading && (
              <Flex justify='center' py={8}>
                <Spinner size='md' />
              </Flex>
            )}

            {error && (
              <Text fontSize='sm' color='red.500'>
                {error}
              </Text>
            )}

            {!isLoading && !error && services.length === 0 && (
              <Text fontSize='sm' color='gray.500'>
                No permanent services found. Use the export button on a map
                layer to create one.
              </Text>
            )}

            {!isLoading && services.length > 0 && (
              <VStack align='stretch' gap={3}>
                {services.map((service) => {
                  const scope = getScope(service);
                  const shareUrl = `${window.location.origin}/share/${service.id}`;
                  const isDeleting = deletingIds.has(service.id);

                  let serviceUrl = service.url;
                  try {
                    serviceUrl = decodeURIComponent(serviceUrl);
                  } catch {
                    /* keep encoded */
                  }

                  return (
                    <Box
                      key={service.id}
                      p={3}
                      borderWidth='1px'
                      borderRadius='md'
                    >
                      <Flex align='center' justify='space-between' mb={2}>
                        <Flex align='center' gap={2}>
                          <Text fontSize='sm' fontWeight='medium'>
                            {(service.configuration?.layerName as string) ||
                              service.title}
                          </Text>
                          <Badge
                            size='sm'
                            colorPalette={
                              scope === 'public' ? 'green' : 'orange'
                            }
                          >
                            {scope}
                          </Badge>
                        </Flex>
                        <IconButton
                          aria-label='Delete service'
                          size='xs'
                          variant='ghost'
                          colorPalette='red'
                          onClick={() => handleDelete(service)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? <Spinner size='xs' /> : <TrashIcon />}
                        </IconButton>
                      </Flex>
                      {service.created && (
                        <Text fontSize='xs' color='gray.500' mb={2}>
                          Created: {new Date(service.created).toLocaleString()}
                        </Text>
                      )}
                      <Flex gap={2} wrap='wrap'>
                        <Clipboard.Root value={serviceUrl}>
                          <Clipboard.Trigger asChild>
                            <Button variant='outline' size='xs'>
                              Copy XYZ URL
                            </Button>
                          </Clipboard.Trigger>
                        </Clipboard.Root>
                        {scope === 'public' && (
                          <Clipboard.Root value={shareUrl}>
                            <Clipboard.Trigger asChild>
                              <Button variant='outline' size='xs'>
                                Copy Share Link
                              </Button>
                            </Clipboard.Trigger>
                          </Clipboard.Root>
                        )}
                        {scope === 'public' && (
                          <Button variant='outline' size='xs' asChild>
                            <a
                              href={shareUrl}
                              target='_blank'
                              rel='noopener noreferrer'
                            >
                              Open
                            </a>
                          </Button>
                        )}
                      </Flex>
                    </Box>
                  );
                })}
              </VStack>
            )}
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
