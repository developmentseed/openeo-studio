import { VStack } from '@chakra-ui/react';

import { CodeEditor } from '$components/editor/code-editor';
import { OutputPanel } from '$components/editor/output-panel';
import { LoaderPanel } from '$components/editor/loader-panel';

interface CodeTabProps {
  isReady: boolean;
}

export function CodeTab({ isReady }: CodeTabProps) {
  if (!isReady) {
    return <OutputPanel />;
  }

  return (
    <VStack flex={1} minHeight={0} gap={2}>
      <LoaderPanel />
      <CodeEditor.View />
    </VStack>
  );
}
