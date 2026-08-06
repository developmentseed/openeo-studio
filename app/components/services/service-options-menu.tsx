import { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Group,
  IconButton,
  IconButtonProps,
  Input,
  Menu,
  Portal,
  RadioGroup,
  Separator,
  Stack,
  Text,
  useClipboard,
  VStack
} from '@chakra-ui/react';
import { useAuth } from 'react-oidc-context';
import { LuCopy, LuCheck, LuEllipsisVertical, LuTrash2 } from 'react-icons/lu';

import {
  getServiceScope,
  type ServiceScope
} from '$components/services/service-scope-badge';
import { ENABLE_NARRATIVE_EXPORT } from '$config/constants';
import { useServicesStore } from '$stores/services-store';
import { buildNarrativeMarkdown } from '$utils/narrative-export';
import {
  decodeServiceUrl,
  getServiceExtent
} from '$utils/openeo/service-adapters';
import { toaster } from '$utils/toaster';
import type { BackendService } from '$types';

const DELETE_ACTION = 'delete';

interface ServiceOptionsMenuProps {
  service: BackendService;
  /** Called after a successful scope change (e.g. to sync page-local state). */
  onScopeChanged?: (scope: ServiceScope) => void;
  /** Called after a successful delete (e.g. to navigate away). */
  onDeleted?: () => void;
  triggerProps?: IconButtonProps;
  /**
   * When false, renders the menu inside the current DOM tree (required inside
   * Dialog — a body portal is dismissed by the dialog focus trap).
   */
  portalled?: boolean;
}

function getNarrativeMarkdown(service: BackendService): string {
  const url = decodeServiceUrl(service.url);
  const extent = getServiceExtent(service);
  const center: [number, number] = extent
    ? [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2]
    : [0, 0];
  const zoom = extent
    ? Math.round(Math.log2(360 / Math.max(extent[2] - extent[0], 0.001)) + 1)
    : 6;
  const layerName = (service.configuration?.layerName as string) || '';

  return buildNarrativeMarkdown({ tileUrl: url, center, zoom, layerName });
}

function ClipboardField({
  label,
  value,
  'aria-label': ariaLabel
}: {
  label: string;
  value: string;
  'aria-label': string;
}) {
  const clipboard = useClipboard({ value });

  return (
    <Stack gap={1}>
      <Text fontSize='sm' fontWeight='bold'>
        {label}
      </Text>

      <Group attached w='full' maxW='sm'>
        <Input
          flex='1'
          size='xs'
          readOnly
          aria-label={ariaLabel}
          rounded='uni'
          value={value}
        />
        <IconButton
          variant='outline'
          size='xs'
          aria-label={`Copy ${label}`}
          onClick={clipboard.copy}
        >
          {clipboard.copied ? <LuCheck /> : <LuCopy />}
        </IconButton>
      </Group>
    </Stack>
  );
}

function MenuPanel({
  showOwnerActions,
  isBusy,
  scope,
  serviceUrl,
  shareUrl,
  service,
  onScopeChange
}: {
  showOwnerActions: boolean;
  isBusy: boolean;
  scope: ServiceScope;
  serviceUrl: string;
  shareUrl: string;
  service: BackendService;
  onScopeChange: (scope: ServiceScope) => void;
}) {
  return (
    <Menu.Content
      minW='18rem'
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      bg='bg.subtle'
      p={0}
      gap={1}
      display='flex'
      flexDirection='column'
      alignItems='stretch'
    >
      <Box px={3} py={2} bg='bg'>
        <Text fontSize='xs' fontWeight='bold'>
          Menu
        </Text>
      </Box>

      {showOwnerActions && (
        <Stack px={3} py={2} gap={1}>
          <Text fontSize='sm' fontWeight='bold'>
            Scope
          </Text>
          <VStack align='stretch' gap={0} asChild>
            <RadioGroup.Root
              size='sm'
              value={scope}
              disabled={isBusy}
              onValueChange={(details) => {
                onScopeChange(details.value as ServiceScope);
              }}
            >
              {(
                [
                  { value: 'public', label: 'Public' },
                  { value: 'private', label: 'Private' }
                ] as const
              ).map((option) => (
                <Flex
                  key={option.value}
                  align='center'
                  justify='space-between'
                  borderRadius='sm'
                  lineHeight='1.75rem'
                >
                  <Text fontSize='sm' truncate flex={1}>
                    {option.label}
                  </Text>
                  <RadioGroup.Item
                    value={option.value}
                    disabled={option.value === 'public'}
                  >
                    <RadioGroup.ItemHiddenInput />
                    <RadioGroup.ItemIndicator />
                  </RadioGroup.Item>
                </Flex>
              ))}
            </RadioGroup.Root>
          </VStack>
        </Stack>
      )}

      {showOwnerActions && <Separator />}

      <VStack align='stretch' gap={2} px={3} py={2}>
        <ClipboardField
          label='XYZ url'
          value={serviceUrl}
          aria-label='XYZ tile URL'
        />
        {scope === 'public' && (
          <ClipboardField
            label='Share url'
            value={shareUrl}
            aria-label='Share url'
          />
        )}
      </VStack>

      {(ENABLE_NARRATIVE_EXPORT || showOwnerActions) && (
        <>
          <Separator />
          <Stack gap={0}>
            {ENABLE_NARRATIVE_EXPORT && <CopyNarrative service={service} />}

            {showOwnerActions && (
              <Menu.Item
                as='button'
                value={DELETE_ACTION}
                fontWeight='semibold'
                color='fg.error'
                _hover={{ bg: 'bg.error', color: 'fg.error' }}
                _icon={{ w: 4, h: 4 }}
                disabled={isBusy}
                p={3}
              >
                <LuTrash2 /> Delete
              </Menu.Item>
            )}
          </Stack>
        </>
      )}
    </Menu.Content>
  );
}

export function ServiceOptionsMenu({
  service,
  onScopeChanged,
  onDeleted,
  triggerProps,
  portalled = true
}: ServiceOptionsMenuProps) {
  const { user, isAuthenticated } = useAuth();
  const deleteService = useServicesStore((s) => s.deleteService);
  const updateServiceScope = useServicesStore((s) => s.updateServiceScope);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingScope, setIsUpdatingScope] = useState(false);

  const scope = getServiceScope(service.configuration);
  const shareUrl = `${window.location.origin}/share/${service.id}`;
  const serviceUrl = decodeServiceUrl(service.url);
  const isBusy = isDeleting || isUpdatingScope;
  const showOwnerActions = isAuthenticated;

  const handleScopeChange = async (nextScope: ServiceScope) => {
    if (!user?.access_token || isBusy || nextScope === scope) return;
    setIsUpdatingScope(true);
    try {
      await updateServiceScope(user.access_token, service, nextScope);
      onScopeChanged?.(nextScope);
      toaster.success({
        title:
          nextScope === 'public'
            ? 'Service made public'
            : 'Service made private'
      });
    } catch (error) {
      toaster.error({
        title: 'Failed to update service visibility',
        description: error instanceof Error ? error.message : undefined
      });
    } finally {
      setIsUpdatingScope(false);
    }
  };

  const handleDelete = async () => {
    if (!user?.access_token || isBusy) return;
    setIsDeleting(true);
    try {
      await deleteService(user.access_token, service.id);
      toaster.success({ title: 'Service deleted' });
      onDeleted?.();
    } catch (error) {
      toaster.error({
        title: 'Failed to delete service',
        description: error instanceof Error ? error.message : undefined
      });
      setIsDeleting(false);
    }
  };

  return (
    <Menu.Root
      positioning={{
        placement: 'bottom-end',
        ...(portalled
          ? {}
          : { strategy: 'fixed' as const, hideWhenDetached: true })
      }}
      onSelect={(details) => {
        if (details.value === DELETE_ACTION) handleDelete();
      }}
    >
      <Menu.Trigger asChild>
        <IconButton
          aria-label='More options'
          size='xs'
          variant='ghost'
          loading={isBusy}
          {...triggerProps}
        >
          <LuEllipsisVertical />
        </IconButton>
      </Menu.Trigger>
      <Portal disabled={!portalled}>
        <Menu.Positioner>
          <MenuPanel
            showOwnerActions={showOwnerActions}
            isBusy={isBusy}
            scope={scope}
            serviceUrl={serviceUrl}
            shareUrl={shareUrl}
            service={service}
            onScopeChange={handleScopeChange}
          />
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}

function CopyNarrative({ service }: { service: BackendService }) {
  const clipboard = useClipboard({ value: getNarrativeMarkdown(service) });

  return (
    <Button
      variant='ghost'
      size='sm'
      p={3}
      w='100%'
      h='auto'
      justifyContent='flex-start'
      rounded='none'
      border='none'
      onClick={clipboard.copy}
    >
      {clipboard.copied ? <LuCheck /> : <LuCopy />}{' '}
      {clipboard.copied ? 'Copied' : 'Copy narrative'}
    </Button>
  );
}
