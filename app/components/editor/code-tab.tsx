import { Flex, Popover, Portal, VStack } from '@chakra-ui/react';
import { useShallow } from 'zustand/shallow';

import { CodeEditor } from '$components/editor/code-editor';
import { OutputPanel } from '$components/editor/output-panel';
import { LoaderPanel } from '$components/editor/loader-panel';
import { AvailableVariables } from '$components/editor/available-variables';
import { InfoIconButton } from '$components/editor/icon-buttons';
import { usePyodide } from '$contexts/pyodide-context';
import { useEditorStore } from '$stores/editor-store';

export function CodeTab() {
  const { pyodide } = usePyodide();
  const isReady = !!pyodide;

  const selectedBands = useEditorStore(
    useShallow((state) => state.selectedConfig.selectedBands || [])
  );

  return (
    <Flex flexDirection='column' height='100%'>
      <Flex marginLeft='auto' alignItems='center'>
        <Popover.Root positioning={{ placement: 'bottom-end' }} size='lg'>
          <Popover.Trigger asChild>
            <InfoIconButton />
          </Popover.Trigger>
          <Portal>
            <Popover.Positioner>
              <Popover.Content minW='lg'>
                <Popover.CloseTrigger />
                <Popover.Arrow />
                <Popover.Body>
                  <Popover.Title fontWeight='medium'>
                    Available Variables
                  </Popover.Title>
                  <AvailableVariables selectedBands={selectedBands} />
                </Popover.Body>
              </Popover.Content>
            </Popover.Positioner>
          </Portal>
        </Popover.Root>
      </Flex>

      {!isReady ? (
        <OutputPanel />
      ) : (
        <VStack flex={1} minHeight={0} gap={2}>
          <LoaderPanel />
          <CodeEditor.View />
        </VStack>
      )}
    </Flex>
  );
}
