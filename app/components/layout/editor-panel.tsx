import { Flex } from '@chakra-ui/react';
import { useAuth } from 'react-oidc-context';

import { Editor } from '$components/editor';
import { OutputPanel } from '$components/editor/output-panel';
import { usePyodide } from '$contexts/pyodide-context';
import type { ExecutionConfig, ServiceInfo } from '$types';

interface EditorPanelProps {
  config: ExecutionConfig;
  initialCode?: string;
  setServices: (services: ServiceInfo[]) => void;
  onSelectedBandsChange?: (bands: string[]) => void;
  onCollectionChange?: (collectionId: string) => void;
  onTemporalRangeChange?: (temporalRange: [string, string]) => void;
}

export function EditorPanel({
  config,
  initialCode,
  setServices,
  onSelectedBandsChange,
  onCollectionChange,
  onTemporalRangeChange
}: EditorPanelProps) {
  const { pyodide } = usePyodide();
  const { isAuthenticated } = useAuth();
  const isReady = isAuthenticated && !!pyodide;

  return (
    <Flex flexDirection='column' p={4} gap={2} height='100%' overflow='hidden'>
      {isReady ? (
        <Editor
          config={config}
          initialCode={initialCode}
          setServices={setServices}
          onSelectedBandsChange={onSelectedBandsChange}
          onCollectionChange={onCollectionChange}
          onTemporalRangeChange={onTemporalRangeChange}
        />
      ) : (
        <OutputPanel />
      )}
    </Flex>
  );
}
