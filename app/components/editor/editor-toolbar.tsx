import { Button } from '@chakra-ui/react';

interface EditorToolbarProps {
  executeCode: () => Promise<void>;
  isExecuting: boolean;
  isReady: boolean;
}

export function EditorToolbar({
  executeCode,
  isExecuting,
  isReady
}: EditorToolbarProps) {
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
