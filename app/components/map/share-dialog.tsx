import { useState } from 'react';
import {
  Box,
  Button,
  Clipboard,
  Dialog,
  Flex,
  Heading,
  RadioGroup,
  Spinner,
  Text,
  VStack
} from '@chakra-ui/react';
import { useAuth } from 'react-oidc-context';

import { createPermanentService } from '../../utils/code-runner';
import type { BackendService, ServiceInfo } from '$types';

interface ShareDialogProps {
  service: ServiceInfo;
  bounds?: [number, number, number, number];
  onClose: () => void;
}

export function ShareDialog({ service, bounds, onClose }: ShareDialogProps) {
  const { user } = useAuth();
  const [scope, setScope] = useState<'public' | 'private'>('public');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<BackendService | null>(null);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create service');
    } finally {
      setIsCreating(false);
    }
  };

  const shareUrl = created
    ? `${window.location.origin}/share/${created.id}`
    : '';

  // The backend url field is already the full XYZ tile URL template
  const tileUrl = created?.url ?? '';

  return (
    <Dialog.Root
      open
      onOpenChange={(details) => {
        if (!details.open) onClose();
      }}
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content maxW='md' p={6}>
          <Dialog.CloseTrigger />
          <Dialog.Header p={0} mb={4}>
            <Heading size='md'>
              {created ? 'Service Created' : 'Export as Permanent Service'}
            </Heading>
          </Dialog.Header>
          <Dialog.Body p={0}>
            {!created ? (
              <VStack align='stretch' gap={4}>
                <Text fontSize='sm' color='gray.600'>
                  Create a permanent XYZ service for{' '}
                  <strong>{service.graphResult.name}</strong>. This service will
                  not be automatically cleaned up.
                </Text>
                <Box>
                  <Text fontSize='sm' fontWeight='medium' mb={2}>
                    Visibility
                  </Text>
                  <RadioGroup.Root
                    value={scope}
                    onValueChange={(details) =>
                      setScope(details.value as 'public' | 'private')
                    }
                  >
                    <VStack align='stretch' gap={2}>
                      <RadioGroup.Item value='public'>
                        <RadioGroup.ItemHiddenInput />
                        <RadioGroup.ItemIndicator />
                        <RadioGroup.ItemText>
                          Public — accessible without authentication
                        </RadioGroup.ItemText>
                      </RadioGroup.Item>
                      <RadioGroup.Item value='private'>
                        <RadioGroup.ItemHiddenInput />
                        <RadioGroup.ItemIndicator />
                        <RadioGroup.ItemText>
                          Private — requires authentication
                        </RadioGroup.ItemText>
                      </RadioGroup.Item>
                    </VStack>
                  </RadioGroup.Root>
                </Box>
                {error && (
                  <Text fontSize='sm' color='red.500'>
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
            ) : (
              <VStack align='stretch' gap={4}>
                <Text fontSize='sm' color='green.600'>
                  Permanent service created successfully.
                </Text>

                <Box>
                  <Text fontSize='sm' fontWeight='medium' mb={1}>
                    XYZ Tile URL
                  </Text>
                  <Clipboard.Root value={tileUrl}>
                    <Clipboard.Control>
                      <Clipboard.Input readOnly fontSize='xs' />
                      <Clipboard.Trigger asChild>
                        <Button variant='outline' size='xs'>
                          Copy
                        </Button>
                      </Clipboard.Trigger>
                    </Clipboard.Control>
                  </Clipboard.Root>
                </Box>

                {scope === 'public' && (
                  <Box>
                    <Text fontSize='sm' fontWeight='medium' mb={1}>
                      Shareable Link
                    </Text>
                    <Clipboard.Root value={shareUrl}>
                      <Clipboard.Control>
                        <Clipboard.Input readOnly fontSize='xs' />
                        <Clipboard.Trigger asChild>
                          <Button variant='outline' size='xs'>
                            Copy
                          </Button>
                        </Clipboard.Trigger>
                      </Clipboard.Control>
                    </Clipboard.Root>
                  </Box>
                )}

                <Flex justify='flex-end'>
                  <Button size='sm' onClick={onClose}>
                    Done
                  </Button>
                </Flex>
              </VStack>
            )}
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
