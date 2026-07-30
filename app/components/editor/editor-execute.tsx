import { Button, Portal, Tooltip } from '@chakra-ui/react';
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

  return (
    <Tooltip.Root open={isExecuting} positioning={{ placement: 'bottom' }}>
      <Tooltip.Trigger asChild>
        <Button
          size='sm'
          variant='outline'
          disabled={
            !isReady ||
            isExecuting ||
            !isAuthenticated ||
            !sceneName.trim() ||
            !(hasCodeChanged || hasConfigChanged)
          }
          onClick={executeCode}
          loading={isExecuting}
        >
          Save <LuCheck />
        </Button>
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
