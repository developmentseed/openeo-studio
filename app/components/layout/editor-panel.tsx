import { Flex, Popover, Portal, Tabs, VStack } from '@chakra-ui/react';

import { CodeEditor, useCodeEditor } from '$components/editor/code-editor';
import { useCodeExecution } from '$components/editor/use-code-execution';
import { EditorToolbar } from '$components/editor/editor-toolbar';
import { OutputPanel } from '$components/editor/output-panel';
import { usePyodide } from '$contexts/pyodide-context';
import type { ExecutionConfig, ServiceInfo, BandVariable } from '$types';
import { AvailableVariables } from '$components/editor/available-variables';
import { BandArrayBuilder } from '$components/setup/band-array-builder';
import { CollectionDisplay } from '$components/setup/collection-display';
import { TemporalRangePicker } from '$components/setup/temporal-range-picker';
import { CloudCoverSlider } from '$components/setup/cloud-cover-slider';
import { InfoIconButton } from '$components/editor/icon-buttons';

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
          <VStack gap={6} align='stretch'>
            <CollectionDisplay collectionId={config.collectionId} />

            <TemporalRangePicker
              temporalRange={config.temporalRange}
              onTemporalRangeChange={onTemporalRangeChange}
            />

            <CloudCoverSlider
              cloudCover={config.cloudCover || 100}
              onCloudCoverChange={onCloudCoverChange}
            />

            {availableBands && onSelectedBandsChange && (
              <BandArrayBuilder
                availableBands={availableBands}
                selectedBands={config.selectedBands || []}
                onSelectionChange={onSelectedBandsChange}
              />
            )}
          </VStack>
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
          <Flex justifyContent='flex-end' mb={2}>
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

          {isReady ? (
            <Flex
              flexDirection='column'
              flex={1}
              minHeight={0}
              overflow='hidden'
            >
              <CodeEditor.View />
            </Flex>
          ) : (
            <OutputPanel />
          )}
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
