import { Flex, Popover, Portal } from '@chakra-ui/react';

import { CodeEditor } from '$components/editor/code-editor';
import { OutputPanel } from '$components/editor/output-panel';
import { AvailableVariables } from '$components/editor/available-variables';
import { InfoIconButton } from '$components/editor/icon-buttons';

interface CodeTabProps {
  isReady: boolean;
  selectedBands: string[];
}

export function CodeTab({ isReady, selectedBands }: CodeTabProps) {
  return (
    <>
      <Flex justifyContent='flex-end' mb={2}>
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

      {isReady ? (
        <Flex flex={1} minHeight={0} overflow='hidden'>
          <CodeEditor.View />
        </Flex>
      ) : (
        <OutputPanel />
      )}
    </>
  );
}
