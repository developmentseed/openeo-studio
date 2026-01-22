import { Flex, Tabs } from '@chakra-ui/react';

import { CodeEditor, useCodeEditor } from '$components/editor/code-editor';
import { useCodeExecution } from '$components/editor/use-code-execution';
import { EditorToolbar } from '$components/editor/editor-toolbar';
import { ConfigurationTab } from '$components/editor/configuration-tab';
import { CodeTab } from '$components/editor/code-tab';
import { usePyodide } from '$contexts/pyodide-context';
import type { ExecutionConfig, ServiceInfo, BandVariable } from '$types';

interface EditorPanelProps {
  config: ExecutionConfig;
  availableBands?: BandVariable[];
  initialCode?: string;
  setServices: (services: ServiceInfo[]) => void;
  onSelectedBandsChange?: (bands: string[]) => void;
  onTemporalRangeChange: (temporalRange: [string, string]) => void;
  onCloudCoverChange: (cloudCover: number) => void;
}

export function EditorPanel({
  config,
  availableBands,
  initialCode,
  setServices,
  onSelectedBandsChange,
  onTemporalRangeChange,
  onCloudCoverChange
}: EditorPanelProps) {
  const { pyodide } = usePyodide();
  const isReady = !!pyodide;

  return (
    <CodeEditor.Root initialCode={initialCode}>
      <EditorPanelContent
        config={config}
        availableBands={availableBands}
        setServices={setServices}
        onSelectedBandsChange={onSelectedBandsChange}
        onTemporalRangeChange={onTemporalRangeChange}
        onCloudCoverChange={onCloudCoverChange}
        isReady={isReady}
      />
    </CodeEditor.Root>
  );
}

/**
 * Internal: Must be rendered inside CodeEditor.Root to access editor context
 */
function EditorPanelContent({
  config,
  availableBands,
  setServices,
  onSelectedBandsChange,
  onTemporalRangeChange,
  onCloudCoverChange,
  isReady
}: Omit<EditorPanelProps, 'initialCode'> & { isReady: boolean }) {
  const editor = useCodeEditor();
  const {
    executeCode,
    isExecuting,
    isReady: isExecutionReady
  } = useCodeExecution(setServices, editor, config);

  return (
    <Flex flexDirection='column' height='100%'>
      <Tabs.Root
        defaultValue='configuration'
        display='flex'
        flex={1}
        flexDirection='column'
        minHeight={0}
      >
        <Tabs.List>
          <Tabs.Trigger value='configuration'>CONFIGURATION</Tabs.Trigger>
          <Tabs.Trigger value='code'>CODE</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value='configuration' flex={1} overflow='auto' p={4}>
          <ConfigurationTab
            collectionId={config.collectionId}
            temporalRange={config.temporalRange}
            cloudCover={config.cloudCover || 100}
            selectedBands={config.selectedBands || []}
            availableBands={availableBands}
            onTemporalRangeChange={onTemporalRangeChange}
            onCloudCoverChange={onCloudCoverChange}
            onSelectedBandsChange={onSelectedBandsChange}
          />
        </Tabs.Content>

        <Tabs.Content
          value='code'
          flex={1}
          display='flex'
          flexDirection='column'
          p={4}
          minHeight={0}
          overflow='hidden'
        >
          <CodeTab
            isReady={isReady}
            selectedBands={config.selectedBands || []}
          />
        </Tabs.Content>
      </Tabs.Root>

      {/* Toolbar outside tabs - accessible from any tab */}
      <EditorToolbar
        isReady={isExecutionReady}
        isExecuting={isExecuting}
        executeCode={executeCode}
      />
    </Flex>
  );
}
