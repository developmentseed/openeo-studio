import { Text } from '@chakra-ui/react';
import { usePyodide } from '$utils/code-runner';

export function StatusBar() {
  const { pyodide } = usePyodide();

  if (!pyodide) {
    return (
      <Text fontSize='xs' color='base.500'>
        Loading Python environment...
      </Text>
    );
  }

  return (
    <Text fontSize='xs' color='green.500'>
      ✓ Python ready
    </Text>
  );
}
