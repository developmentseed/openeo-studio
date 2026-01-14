import { Flex } from '@chakra-ui/react';

import { Editor } from '$components/editor';
import { OutputPanel } from '$components/editor/output-panel';
import { usePyodide } from '$contexts/pyodide-context';
import type { ExecutionConfig, ServiceInfo, BandVariable } from '$types';

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
      {isReady ? (
        <Editor
          config={config}
          availableBands={availableBands}
          initialCode={initialCode}
          setServices={setServices}
          onSelectedBandsChange={onSelectedBandsChange}
        />
      ) : (
        <OutputPanel />
      )}
    </Flex>
  );
}
