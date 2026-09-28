import { List, Text } from '@chakra-ui/react';

import { usePyodide } from '$contexts/pyodide-context';

export function OutputPanel() {
  const { log } = usePyodide();

  if (log.length === 0) {
    return null;
  }

  return (
    <List.Root variant='plain' gap={3} p={4}>
      {log.map((l, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <List.Item key={index}>
          <Text
            fontFamily='monospace'
            color={
              l.type === 'info'
                ? 'fg'
                : l.type === 'success'
                  ? 'fg.success'
                  : 'fg.error'
            }
            pl={l.type !== 'success' ? 4 : 0}
            m={0}
          >
            {l.type === 'success' ? '✓ ' : l.type === 'error' ? '✗ ' : ''}
            {l.message}
          </Text>
        </List.Item>
      ))}
    </List.Root>
  );
}
