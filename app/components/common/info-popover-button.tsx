import { useState } from 'react';
import { IconButton, Popover, Portal } from '@chakra-ui/react';
import { LuInfo, LuX } from 'react-icons/lu';

const STORAGE_KEY_PREFIX = 'openeo-studio-info-seen';

function hasBeenSeen(storageKey: string): boolean {
  return sessionStorage.getItem(`${STORAGE_KEY_PREFIX}:${storageKey}`) !== null;
}

function markAsSeen(storageKey: string): void {
  sessionStorage.setItem(`${STORAGE_KEY_PREFIX}:${storageKey}`, '1');
}

export interface InfoPopoverButtonProps {
  /** Unique key identifying the page/context, used to track whether the popover was already shown this session. */
  storageKey: string;
  label: string;
  children: React.ReactNode;
}

/**
 * Info icon button that opens a popover with contextual help text.
 * Automatically opens the first time it's rendered in a given browser session
 * for a given `storageKey`, then stays closed until dismissed.
 */
export function InfoPopoverButton({
  storageKey,
  label,
  children
}: InfoPopoverButtonProps) {
  const [open, setOpen] = useState(() => !hasBeenSeen(storageKey));

  return (
    <Popover.Root
      open={open}
      onOpenChange={(details) => {
        setOpen(details.open);
        if (!details.open) {
          markAsSeen(storageKey);
        }
      }}
      positioning={{ placement: 'bottom-start' }}
      size='sm'
    >
      <Popover.Trigger asChild>
        <IconButton size='xs' variant='ghost' aria-label={label}>
          <LuInfo />
        </IconButton>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content maxW='sm'>
            <Popover.Arrow />
            <Popover.Header
              display='flex'
              justifyContent='space-between'
              alignItems='center'
            >
              <Popover.Title fontWeight='bold'>{label}</Popover.Title>
              <Popover.CloseTrigger asChild>
                <IconButton size='xs' variant='ghost' aria-label='Close'>
                  <LuX />
                </IconButton>
              </Popover.CloseTrigger>
            </Popover.Header>
            <Popover.Body>{children}</Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}
