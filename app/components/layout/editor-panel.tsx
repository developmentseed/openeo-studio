import { Flex, Popover, Portal, Tabs } from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';

import { CodeEditor, useCodeEditor } from '$components/editor/code-editor';
import { useCodeExecution } from '$components/editor/use-code-execution';
import { EditorToolbar } from '$components/editor/editor-toolbar';
import { ConfigurationTab } from '$components/editor/configuration-tab';
import { CodeTab } from '$components/editor/code-tab';
import { ExecutionErrorAlert } from '$components/editor/execution-error-alert';
import { AvailableVariables } from '$components/editor/available-variables';
import { InfoIconButton } from '$components/editor/icon-buttons';
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
  defaultTab?: 'configuration' | 'code';
  autoExecuteOnReady?: boolean;
}

export function EditorPanel({
  config,
  availableBands,
  initialCode,
  setServices,
  onSelectedBandsChange,
  onTemporalRangeChange,
  onCloudCoverChange,
  defaultTab = 'configuration',
  autoExecuteOnReady = false
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
        defaultTab={defaultTab}
        autoExecuteOnReady={autoExecuteOnReady}
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
  isReady,
  defaultTab = 'configuration',
  autoExecuteOnReady = false
}: Omit<EditorPanelProps, 'initialCode'> & {
  isReady: boolean;
  defaultTab?: 'configuration' | 'code';
  autoExecuteOnReady?: boolean;
}) {
  const editor = useCodeEditor();
  const [activeTab, setActiveTab] = useState<'configuration' | 'code'>(
    defaultTab
  );
  const [showAutoExecHint, setShowAutoExecHint] = useState(false);
  const [isErrorDismissed, setIsErrorDismissed] = useState(false);
  const {
    executeCode,
    isExecuting,
    isReady: isExecutionReady,
    errorMessage
  } = useCodeExecution(setServices, editor, config);

  const hasAutoExecutedRef = useRef(false);
  useEffect(() => {
    if (!autoExecuteOnReady) return;
    if (hasAutoExecutedRef.current) return;
    if (!isExecutionReady) return;

    hasAutoExecutedRef.current = true;
    setShowAutoExecHint(true);
    const t = setTimeout(() => setShowAutoExecHint(false), 1500);
    executeCode();
    return () => clearTimeout(t);
  }, [autoExecuteOnReady, isExecutionReady, executeCode]);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    if (errorMessage) {
      setIsErrorDismissed(false);
    }
  }, [errorMessage]);

  return (
    <Flex flexDirection='column' height='100%'>
      <Tabs.Root
        variant='subtle'
        value={activeTab}
        onValueChange={({ value }) =>
          setActiveTab(value as 'configuration' | 'code')
        }
        display='flex'
        flex={1}
        flexDirection='column'
        minHeight={0}
        position='relative'
      >
        <Tabs.List px='lg' py='sm'>
          <Tabs.Trigger value='configuration'>CONFIGURATION</Tabs.Trigger>
          <Tabs.Trigger value='code'>CODE</Tabs.Trigger>
          {activeTab === 'code' && (
            <Flex marginLeft='auto' alignItems='center'>
              <Popover.Root positioning={{ placement: 'bottom-end' }} size='lg'>
                <Popover.Trigger asChild>
                  <InfoIconButton />
                </Popover.Trigger>
                <Portal>
                  <Popover.Positioner>
                    <Popover.Content minW='lg'>
                      <Popover.CloseTrigger />
                      <Popover.Arrow />
                      <Popover.Body>
                        <Popover.Title fontWeight='medium'>
                          Available Variables
                        </Popover.Title>
                        <AvailableVariables
                          selectedBands={config.selectedBands || []}
                        />
                      </Popover.Body>
                    </Popover.Content>
                  </Popover.Positioner>
                </Portal>
              </Popover.Root>
            </Flex>
          )}
        </Tabs.List>

        <Tabs.Content value='configuration' flex={1} overflow='auto' p={4}>
          <ConfigurationTab
            collectionId={config.collectionId}
            temporalRange={config.temporalRange}
            cloudCover={config.cloudCover || 100}
            selectedBands={config.selectedBands || []}
            availableBands={availableBands}
            boundingBox={config.boundingBox}
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
          px={4}
          py={0}
          minHeight={0}
          overflow='hidden'
        >
          <CodeTab isReady={isReady} />
        </Tabs.Content>

        {errorMessage && !isErrorDismissed && (
          <ExecutionErrorAlert
            message={errorMessage}
            onDismiss={() => setIsErrorDismissed(true)}
          />
        )}
      </Tabs.Root>

      {/* Toolbar outside tabs - accessible from any tab */}
      <EditorToolbar
        isReady={isExecutionReady}
        isExecuting={isExecuting}
        executeCode={executeCode}
        showAutoExecHint={showAutoExecHint}
      />
    </Flex>
  );
}
