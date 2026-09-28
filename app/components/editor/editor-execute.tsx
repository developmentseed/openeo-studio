import { Tip } from '$components/tooltip';
import { Box, Button } from '@chakra-ui/react';
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
    <Tip content='Running analysis…' placement='bottom' open={isLoading}>
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
    </Tip>
  );
}
