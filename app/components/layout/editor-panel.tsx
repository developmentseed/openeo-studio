import { Flex } from '@chakra-ui/react';
import { Editor } from '$components/editor';
import { OutputPanel } from '$components/editor/output-panel';
import { usePyodide } from '$utils/code-runner';
import { useAuth } from 'react-oidc-context';
import type { ExecutionConfig } from '$utils/template-renderer';

interface EditorPanelProps {
  config: ExecutionConfig;
  initialCode?: string;
  setTileUrl: (url: string | undefined) => void;
}

export function EditorPanel({
  config,
  initialCode,
  setTileUrl
}: EditorPanelProps) {
  const { pyodide } = usePyodide();
  const { isAuthenticated } = useAuth();
  const isReady = isAuthenticated && !!pyodide;

  return (
    <Flex flexDirection='column' p={4} gap={2} minHeight={0} zIndex={100}>
      <Flex flexDirection='column' gap={2} flexGrow={1} minHeight={0}>
        {isReady ? (
          <Editor
            config={config}
            initialCode={initialCode}
            setTileUrl={setTileUrl}
          />
        ) : (
          <OutputPanel />
        )}
      </Flex>
    </Flex>
  );
}
