import { Box, Button, Portal, Tooltip } from '@chakra-ui/react';
import { LuCheck } from 'react-icons/lu';

interface EditorExecuteProps {
  onExecuteClick: () => void;
  isLoading: boolean;
  disabled: boolean;
  hasPendingChanges: boolean;
}

export function EditorExecute({
  onExecuteClick,
  isLoading,
  disabled,
  hasPendingChanges
}: EditorExecuteProps) {
  return (
    <Tooltip.Root open={isLoading} positioning={{ placement: 'bottom' }}>
      <Tooltip.Trigger asChild>
        <Box position='relative' display='inline-block'>
          <Button
            size='sm'
            variant='outline'
            disabled={disabled}
            onClick={onExecuteClick}
            loading={isLoading}
          >
            Save <LuCheck />
          </Button>
          {hasPendingChanges && (
            <Box
              position='absolute'
              top='-2px'
              right='-2px'
              boxSize='8px'
              borderRadius='full'
              bg='orange.500'
              aria-label='Unsaved changes'
            />
          )}
        </Box>
      </Tooltip.Trigger>
      <Portal>
        <Tooltip.Positioner>
          <Tooltip.Content>
            <Tooltip.Arrow />
            Running analysis…
          </Tooltip.Content>
        </Tooltip.Positioner>
      </Portal>
    </Tooltip.Root>
  );
}
