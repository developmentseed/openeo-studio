import { Flex } from '@chakra-ui/react';
import { CodeEditor, useCodeEditor } from './code-editor';
import { useCodeExecution } from '$components/editor/use-code-execution';
import { EditorToolbar } from './editor-toolbar';
import type { ExecutionConfig, ServiceInfo } from '$types';

interface EditorProps {
  config: ExecutionConfig;
  initialCode?: string;
  setServices: (services: ServiceInfo[]) => void;
}

export function Editor({ config, initialCode, setServices }: EditorProps) {
  return (
    <CodeEditor.Root initialCode={initialCode}>
      <EditorUI config={config} setServices={setServices} />
    </CodeEditor.Root>
  );
}

/**
 * Internal: UI components that need access to the CodeMirror editor instance.
 * Must be rendered inside CodeEditor.Root to access the editor context.
 */
function EditorUI({
  config,
  setServices
}: Pick<EditorProps, 'setServices' | 'config'>) {
  const editor = useCodeEditor();
  const { executeCode, isExecuting, isReady } = useCodeExecution(
    setServices,
    editor,
    config
  );

  return (
    <Flex flexDirection='column' gap={2} height='100%' overflow='hidden'>
      <CodeEditor.View />
      <EditorToolbar
        isReady={isReady}
        isExecuting={isExecuting}
        executeCode={executeCode}
      />
    </Flex>
  );
}
