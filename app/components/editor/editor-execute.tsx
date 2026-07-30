import { Box, Button, Portal, Tooltip } from '@chakra-ui/react';
import { useAuth } from 'react-oidc-context';
import { LuCheck } from 'react-icons/lu';

import { useEditorStore } from '$stores/editor-store';

interface EditorExecuteProps {
  executeCode: () => Promise<void>;
  isExecuting: boolean;
  isReady: boolean;
  hasCodeChanged: boolean;
  hasConfigChanged: boolean;
}

export function EditorExecute({
  executeCode,
  isExecuting,
  isReady,
  hasCodeChanged,
  hasConfigChanged
}: EditorExecuteProps) {
  const { isAuthenticated } = useAuth();
  const sceneName = useEditorStore((state) => state.sceneName);
  const hasPendingChanges = hasCodeChanged || hasConfigChanged;

  return (
    <Tooltip.Root open={isExecuting} positioning={{ placement: 'bottom' }}>
      <Tooltip.Trigger asChild>
        <Box position='relative' display='inline-block'>
          <Button
            size='sm'
            variant='outline'
            disabled={
              !isReady ||
              isExecuting ||
              !isAuthenticated ||
              !sceneName.trim() ||
              !hasPendingChanges
            }
            onClick={executeCode}
            loading={isExecuting}
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
