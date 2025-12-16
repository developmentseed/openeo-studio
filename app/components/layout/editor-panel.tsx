import { Flex } from '@chakra-ui/react';
import { useAuth } from 'react-oidc-context';

import { Editor } from '$components/editor';
import { OutputPanel } from '$components/editor/output-panel';
import { usePyodide } from '$contexts/pyodide-context';
import type { ExecutionConfig } from '$utils/template-renderer';

interface EditorPanelProps {
  config: ExecutionConfig;
  initialCode?: string;
  setTileUrl: (url: string | undefined) => void;
  onSelectedBandsChange?: (bands: string[]) => void;
}

export function EditorPanel({
  config,
  initialCode,
  setTileUrl,
  onSelectedBandsChange
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
          setTileUrl={setTileUrl}
          onSelectedBandsChange={onSelectedBandsChange}
        />
      ) : (
        <OutputPanel />
      )}
    </Flex>
  );
}
