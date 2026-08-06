import { useState } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { useShallow } from 'zustand/shallow';

import { CodeEditor } from '$components/editor/code-editor';
import {
  CodeInfoMenu,
  type CodeViewType
} from '$components/editor/code-options-menu';
import { OutputPanel } from '$components/editor/output-panel';
import { ReadOnlyCodeEditor } from '$components/editor/readonly-code-editor';
import { usePyodide } from '$contexts/pyodide-context';
import { useEditorStore } from '$stores/editor-store';
import loaderPy from '../../algorithms/base/loader.py?raw';

export function CodeTab() {
  const { pyodide } = usePyodide();
  const isReady = !!pyodide;
  const [codeType, setCodeType] = useState<CodeViewType>('algorithm');

  const selectedBands = useEditorStore(
    useShallow((state) => state.selectedConfig.selectedBands || [])
  );

  return (
    <Flex flexDirection='column' height='100%' position='relative'>
      <Box position='absolute' top={4} right={4} zIndex={10}>
        <CodeInfoMenu
          codeType={codeType}
          onCodeTypeChange={setCodeType}
          selectedBands={selectedBands}
        />
      </Box>

      {!isReady ? (
        <OutputPanel />
      ) : (
        <Box flex={1} minHeight={0}>
          {codeType === 'boilerplate' ? (
            <ReadOnlyCodeEditor code={loaderPy} />
          ) : (
            <CodeEditor.View />
          )}
        </Box>
      )}
    </Flex>
  );
}
