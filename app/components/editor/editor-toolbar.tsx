import { Button } from '@chakra-ui/react';
import { useCodeExecution } from '$hooks/use-code-execution';

interface EditorToolbarProps {
  setTileUrl: (url: string | undefined) => void;
}

export function EditorToolbar({ setTileUrl }: EditorToolbarProps) {
  const { executeCode, isExecuting, isReady } = useCodeExecution(setTileUrl);

  return (
    <Button
      colorPalette='blue'
      size='sm'
      disabled={!isReady || isExecuting}
      layerStyle='handDrawn'
      onClick={executeCode}
    >
      {isExecuting ? 'Running...' : 'Run'}
    </Button>
  );
}
