import { Flex } from '@chakra-ui/react';
import { Editor } from '$components/editor';
import { OutputPanel } from '$components/editor/output-panel';
import { usePyodide } from '$utils/code-runner';
import { useAuth } from 'react-oidc-context';

interface EditorPanelProps {
  setTileUrl: (url: string | undefined) => void;
  initialCode?: string;
}

export function EditorPanel({ setTileUrl, initialCode }: EditorPanelProps) {
  const { pyodide } = usePyodide();
  const { isAuthenticated } = useAuth();
  const isReady = isAuthenticated && !!pyodide;

  return (
    <Flex flexDirection='column' p={4} gap={2} minHeight={0} zIndex={100}>
      <Flex flexDirection='column' gap={2} flexGrow={1} minHeight={0}>
        {isReady ? (
          <Editor initialCode={initialCode} setTileUrl={setTileUrl} />
        ) : (
          <OutputPanel />
        )}
      </Flex>
    </Flex>
  );
}
