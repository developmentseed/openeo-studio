import { Button } from '@chakra-ui/react';
import { CodeEditor, useCodeEditor } from './code-editor';
import { useCodeExecution } from '$hooks/use-code-execution';

interface EditorProps {
  setTileUrl: (url: string | undefined) => void;
}

export function Editor({ setTileUrl }: EditorProps) {
  return (
    <CodeEditor.Root>
      <EditorUI setTileUrl={setTileUrl} />
    </CodeEditor.Root>
  );
}

/**
 * Internal: UI components that need access to the CodeMirror editor instance.
 * Must be rendered inside CodeEditor.Root to access the editor context.
 */
function EditorUI({ setTileUrl }: EditorProps) {
  const editor = useCodeEditor();
  const { executeCode, isExecuting, isReady } = useCodeExecution(
    setTileUrl,
    editor
  );

  return (
    <>
      <CodeEditor.View />
      <Button
        colorPalette='blue'
        size='sm'
        disabled={!isReady || isExecuting}
        layerStyle='handDrawn'
        onClick={executeCode}
      >
        {isExecuting ? 'Running...' : 'Run'}
      </Button>
    </>
  );
}
