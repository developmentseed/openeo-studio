import { Flex, Popover, Portal, Tabs, VStack } from '@chakra-ui/react';

import { Editor } from '$components/editor';
import { OutputPanel } from '$components/editor/output-panel';
import { usePyodide } from '$contexts/pyodide-context';
import type { ExecutionConfig, ServiceInfo, BandVariable } from '$types';
import { AvailableVariables } from '$components/editor/available-variables';
import { BandArrayBuilder } from '$components/editor/band-array-builder';
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
        overflow='hidden'
        display='flex'
        flexDirection='column'
        p={4}
      >
        {/* <AvailableVariables selectedBands={config.selectedBands || []} /> */}

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
