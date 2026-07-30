import { IconButton, Menu, Portal } from '@chakra-ui/react';
import { LuEllipsisVertical, LuTrash2 } from 'react-icons/lu';

const DELETE_ACTION = 'delete';

interface EditorOptionsMenuProps {
  onDeleteClick: () => void;
  isDeleteDisabled?: boolean;
  isDeleteLoading?: boolean;
}

export function EditorOptionsMenu({
  onDeleteClick,
  isDeleteDisabled,
  isDeleteLoading
}: EditorOptionsMenuProps) {
  return (
    <Menu.Root
      onSelect={(details) => {
        if (details.value === DELETE_ACTION) onDeleteClick();
      }}
    >
      <Menu.Trigger asChild>
        <IconButton
          aria-label='More options'
          size='sm'
          variant='ghost'
          loading={isDeleteLoading}
          disabled={isDeleteDisabled}
        >
          <LuEllipsisVertical />
        </IconButton>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Item
              value={DELETE_ACTION}
              color='fg.error'
              _hover={{ bg: 'bg.error', color: 'fg.error' }}
            >
              <LuTrash2 /> Delete
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
