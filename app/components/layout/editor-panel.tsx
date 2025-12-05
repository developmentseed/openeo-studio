import { Flex } from '@chakra-ui/react';
import { EditorToolbar } from '$components/editor/editor-toolbar';
import { StacItemCard } from '$components/stac/stac-item-card';
import { CodeEditor } from '$components/editor/code-editor';
import { OutputPanel } from '$components/editor/output-panel';
import { StatusBar } from '$components/editor/status-bar';
import { useCodeExecution } from '$hooks/use-code-execution';
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
  const { isReady } = useCodeExecution(setTileUrl);

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
        {isReady ? (
          <CodeEditor.Root>
            <CodeEditor.View />
          </CodeEditor.Root>
        ) : (
          <OutputPanel />
        )}
        <EditorToolbar setTileUrl={setTileUrl} />
      </Flex>
      <StatusBar />
    </Flex>
  );
}
