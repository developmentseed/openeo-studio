import { Flex } from '@chakra-ui/react';
import { StacItemCard } from '$components/stac/stac-item-card';
import { Editor } from '$components/editor';
import { OutputPanel } from '$components/editor/output-panel';
import { StatusBar } from '$components/editor/status-bar';
import { usePyodide } from '$utils/code-runner';
import { useAuth } from 'react-oidc-context';
import type { StacItem } from 'stac-ts';

interface EditorPanelProps {
  item: StacItem | null;
  isLoading: boolean;
  error: unknown;
  setTileUrl: (url: string | undefined) => void;
}

export function EditorPanel({
  item,
  isLoading,
  error,
  setTileUrl
}: EditorPanelProps) {
  const { pyodide } = usePyodide();
  const { isAuthenticated } = useAuth();
  const isReady = isAuthenticated && !!pyodide;

  return (
    <Flex
      flexDirection='column'
      p={8}
      pt={0}
      gap={2}
      maxW='sm'
      minHeight={0}
      zIndex={100}
    >
      <StacItemCard item={item} isLoading={isLoading} error={error} />
      <Flex flexDirection='column' gap={2} flexGrow={1} minHeight={0}>
        {isReady ? <Editor setTileUrl={setTileUrl} /> : <OutputPanel />}
      </Flex>
      <StatusBar />
    </Flex>
  );
}
