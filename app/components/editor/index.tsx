import { Flex, Button } from '@chakra-ui/react';
import { CodeEditor, useCodeEditor } from './code-editor';
import { useCodeExecution } from '$hooks/use-code-execution';

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
      {/* Toolbar */}
      <Flex justifyContent='flex-end'>
        <Button
          colorPalette='blue'
          size='sm'
          disabled={!isReady || isExecuting}
          layerStyle='handDrawn'
          onClick={executeCode}
        >
          {isExecuting ? 'Running...' : 'Apply'}
        </Button>
      </Flex>
      {/* Editor */}
      <Flex flex={1} minHeight={0}>
        <CodeEditor.View />
      </Flex>
    </Flex>
  );
}
