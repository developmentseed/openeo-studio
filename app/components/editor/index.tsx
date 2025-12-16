import { Flex } from '@chakra-ui/react';
import { CodeEditor, useCodeEditor } from './code-editor';
import { useCodeExecution } from '$hooks/use-code-execution';
import { EditorToolbar } from './editor-toolbar';
import { BandInfo } from './band-info';
import type { ExecutionConfig } from '$utils/template-renderer';

interface EditorProps {
  config: ExecutionConfig;
  initialCode?: string;
  setTileUrl: (url: string | undefined) => void;
}

export function Editor({ config, initialCode, setTileUrl }: EditorProps) {
  return (
    <CodeEditor.Root initialCode={initialCode}>
      <EditorUI config={config} setTileUrl={setTileUrl} />
    </CodeEditor.Root>
  );
}

/**
 * Internal: UI components that need access to the CodeMirror editor instance.
 * Must be rendered inside CodeEditor.Root to access the editor context.
 */
function EditorUI({
  config,
  setTileUrl
}: Pick<EditorProps, 'setTileUrl' | 'config'>) {
  const editor = useCodeEditor();
  const { executeCode, isExecuting, isReady } = useCodeExecution(
    setTileUrl,
    editor,
    config
  );

  return (
    <Flex flexDirection='column' gap={2} height='100%'>
      {config.bands && config.bands.length > 0 && (
        <BandInfo bands={config.bands} />
      )}
      <Flex flex={1} minHeight={0}>
        <CodeEditor.View />
      </Flex>
      <EditorToolbar
        isReady={isReady}
        isExecuting={isExecuting}
        executeCode={executeCode}
      />
    </Flex>
  );
}
