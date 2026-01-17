import { Flex } from '@chakra-ui/react';

import { Editor } from '$components/editor';
import { OutputPanel } from '$components/editor/output-panel';
import { usePyodide } from '$contexts/pyodide-context';
import type { ExecutionConfig, ServiceInfo, BandVariable } from '$types';
import { AvailableVariables } from '$components/editor/available-variables';
import { BandArrayBuilder } from '$components/editor/band-array-builder';

interface EditorPanelProps {
  config: ExecutionConfig;
  availableBands?: BandVariable[];
  initialCode?: string;
  setServices: (services: ServiceInfo[]) => void;
  onSelectedBandsChange?: (bands: string[]) => void;
}

export function EditorPanel({
  config,
  availableBands,
  initialCode,
  setServices,
  onSelectedBandsChange
}: EditorPanelProps) {
  const { pyodide } = usePyodide();
  const isReady = !!pyodide;

  return (
    <Flex flexDirection='column' p={4} gap={2} height='100%' overflow='hidden'>
      {availableBands && onSelectedBandsChange && (
        <BandArrayBuilder
          availableBands={availableBands}
          selectedBands={config.selectedBands || []}
          onSelectionChange={onSelectedBandsChange}
        />
      )}

      <AvailableVariables />

      {isReady ? (
        <Editor
          config={config}
          initialCode={initialCode}
          setServices={setServices}
        />
      ) : (
        <OutputPanel />
      )}
    </Flex>
  );
}
