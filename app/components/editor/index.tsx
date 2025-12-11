import { Flex } from '@chakra-ui/react';
import { CodeEditor, useCodeEditor } from './code-editor';
import { useCodeExecution } from '$hooks/use-code-execution';
import { EditorToolbar } from './editor-toolbar';

interface EditorProps {
  initialCode?: string;
  setTileUrl: (url: string | undefined) => void;
}

export function Editor({ initialCode, setTileUrl }: EditorProps) {
  return (
    <CodeEditor.Root initialCode={initialCode}>
      <EditorUI setTileUrl={setTileUrl} />
    </CodeEditor.Root>
  );
}

/**
 * Internal: UI components that need access to the CodeMirror editor instance.
 * Must be rendered inside CodeEditor.Root to access the editor context.
 */
function EditorUI({ setTileUrl }: Pick<EditorProps, 'setTileUrl'>) {
  const editor = useCodeEditor();
  const { executeCode, isExecuting, isReady } = useCodeExecution(
    setTileUrl,
    editor
  );

  return (
    <Flex flexDirection='column' gap={2} height='100%'>
      <EditorToolbar
        isReady={isReady}
        isExecuting={isExecuting}
        executeCode={executeCode}
      />
      <Flex flex={1} minHeight={0}>
        <CodeEditor.View />
      </Flex>
    </Flex>
  );
}
