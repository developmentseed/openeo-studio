import { Flex, Tabs } from '@chakra-ui/react';

import { Editor } from '$components/editor';
import { OutputPanel } from '$components/editor/output-panel';
import { usePyodide } from '$contexts/pyodide-context';
import type { ExecutionConfig, ServiceInfo, BandVariable } from '$types';
import { AvailableVariables } from '$components/editor/available-variables';
import { BandArrayBuilder } from '$components/editor/band-array-builder';
import { DataConfigForm } from '$components/setup/data-config-form';

interface EditorPanelProps {
  config: ExecutionConfig;
  availableBands?: BandVariable[];
  initialCode?: string;
  setServices: (services: ServiceInfo[]) => void;
  onSelectedBandsChange?: (bands: string[]) => void;
  onConfigApply: (config: {
    collectionId: string;
    temporalRange: [string, string];
    cloudCover: number;
  }) => void;
}

export function EditorPanel({
  config,
  availableBands,
  initialCode,
  setServices,
  onSelectedBandsChange,
  onConfigApply
}: EditorPanelProps) {
  const { pyodide } = usePyodide();
  const isReady = !!pyodide;

  return (
    <Tabs.Root
      defaultValue='configuration'
      height='100%'
      display='flex'
      flexDirection='column'
    >
      <Tabs.List>
        <Tabs.Trigger value='configuration'>CONFIGURATION</Tabs.Trigger>
        <Tabs.Trigger value='code'>CODE</Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value='configuration' flex={1} overflow='auto' p={4}>
        <Flex flexDirection='column' gap={8} height='100%'>
          <DataConfigForm
            collectionId={config.collectionId}
            temporalRange={config.temporalRange}
            cloudCover={config.cloudCover}
            onApply={onConfigApply}
            showActions={true}
          />

          {availableBands && onSelectedBandsChange && (
            <BandArrayBuilder
              availableBands={availableBands}
              selectedBands={config.selectedBands || []}
              onSelectionChange={onSelectedBandsChange}
            />
          )}
        </Flex>
      </Tabs.Content>

      <Tabs.Content
        value='code'
        flex={1}
        overflow='hidden'
        display='flex'
        flexDirection='column'
        p={4}
      >
        <AvailableVariables selectedBands={config.selectedBands || []} />

        {isReady ? (
          <Editor
            config={config}
            initialCode={initialCode}
            setServices={setServices}
          />
        ) : (
          <OutputPanel />
        )}
      </Tabs.Content>
    </Tabs.Root>
  );
}
