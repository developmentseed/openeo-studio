import { Flex } from '@chakra-ui/react';
import { CodeEditor, useCodeEditor } from './code-editor';
import { useCodeExecution } from '$hooks/use-code-execution';
import { EditorToolbar } from './editor-toolbar';
import { AvailableVariables } from './available-variables';
import { BandArrayBuilder } from './band-array-builder';
import type { ExecutionConfig, ServiceInfo } from '$types';

interface EditorProps {
  config: ExecutionConfig;
  initialCode?: string;
  setServices: (services: ServiceInfo[]) => void;
  onSelectedBandsChange?: (bands: string[]) => void;
}

export function Editor({
  config,
  initialCode,
  setServices,
  onSelectedBandsChange
}: EditorProps) {
  return (
    <CodeEditor.Root initialCode={initialCode}>
      <EditorUI
        config={config}
        setServices={setServices}
        onSelectedBandsChange={onSelectedBandsChange}
      />
    </CodeEditor.Root>
  );
}

/**
 * Internal: UI components that need access to the CodeMirror editor instance.
 * Must be rendered inside CodeEditor.Root to access the editor context.
 */
function EditorUI({
  config,
  setServices,
  onSelectedBandsChange
}: Pick<EditorProps, 'setServices' | 'config' | 'onSelectedBandsChange'>) {
  const editor = useCodeEditor();
  const { executeCode, isExecuting, isReady } = useCodeExecution(
    setServices,
    editor,
    config
  );

  return (
    <Flex flexDirection='column' gap={2} height='100%' overflow='hidden'>
      {config.bands && onSelectedBandsChange && (
        <BandArrayBuilder
          availableBands={config.bands}
          selectedBands={config.selectedBands || []}
          onSelectionChange={onSelectedBandsChange}
        />
      )}

      <AvailableVariables />

      <Flex flex={1} minHeight={0} overflow='hidden'>
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
