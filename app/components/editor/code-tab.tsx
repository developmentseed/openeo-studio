import { Flex } from '@chakra-ui/react';

import { CodeEditor } from '$components/editor/code-editor';
import { OutputPanel } from '$components/editor/output-panel';

interface CodeTabProps {
  isReady: boolean;
}

export function CodeTab({ isReady }: CodeTabProps) {
  if (!isReady) {
    return <OutputPanel />;
  }

  return (
    <Flex flex={1} minHeight={0} overflow='hidden'>
      <CodeEditor.View />
    </Flex>
  );
}
