import { Flex } from '@chakra-ui/react';
import { CodeEditor, useCodeEditor } from './code-editor';
import { useCodeExecution } from '$hooks/use-code-execution';
import { EditorToolbar } from './editor-toolbar';
import { AvailableVariables } from './available-variables';
import { BandArrayBuilder } from './band-array-builder';
import { CollectionConfig } from './collection-config';
import type { ExecutionConfig, ServiceInfo } from '$types';

interface EditorProps {
  config: ExecutionConfig;
  initialCode?: string;
  setServices: (services: ServiceInfo[]) => void;
  onSelectedBandsChange?: (bands: string[]) => void;
  onCollectionChange?: (collectionId: string) => void;
  onTemporalRangeChange?: (temporalRange: [string, string]) => void;
}

export function Editor({
  config,
  initialCode,
  setServices,
  onSelectedBandsChange,
  onCollectionChange,
  onTemporalRangeChange
}: EditorProps) {
  return (
    <CodeEditor.Root initialCode={initialCode}>
      <EditorUI
        config={config}
        setServices={setServices}
        onSelectedBandsChange={onSelectedBandsChange}
        onCollectionChange={onCollectionChange}
        onTemporalRangeChange={onTemporalRangeChange}
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
  onSelectedBandsChange,
  onCollectionChange,
  onTemporalRangeChange
}: Pick<
  EditorProps,
  | 'setServices'
  | 'config'
  | 'onSelectedBandsChange'
  | 'onCollectionChange'
  | 'onTemporalRangeChange'
>) {
  const editor = useCodeEditor();
  const { executeCode, isExecuting, isReady } = useCodeExecution(
    setServices,
    editor,
    config
  );

  return (
    <Flex flexDirection='column' gap={2} height='100%' overflow='hidden'>
      <CollectionConfig
        collectionId={config.collectionId}
        temporalRange={config.temporalRange || ['2023-01-01', '2023-12-31']}
        onCollectionChange={onCollectionChange}
        onTemporalRangeChange={onTemporalRangeChange}
      />

      {config.bands && config.bands.length > 0 && onSelectedBandsChange && (
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
