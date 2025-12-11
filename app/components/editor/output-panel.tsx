import { Flex, Text } from '@chakra-ui/react';
import { usePyodide } from '$utils/code-runner';

export function OutputPanel() {
  const { log, pyodide } = usePyodide();

  return (
    <Flex flexDirection='column' gap={2} flexGrow={1} minHeight={0}>
      {/* Status */}
      {!pyodide ? (
        <Text fontSize='xs' color='base.500'>
          Loading Python environment...
        </Text>
      ) : (
        <Text fontSize='xs' color='green.500'>
          ✓ Python ready
        </Text>
      )}

      {/* Logs */}
      {log.length > 0 && (
        <Flex flexGrow={1} gap={2} flexDirection='column' overflowY='auto'>
          {log.map((l, index) => (
            <Text
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              fontFamily='monospace'
              fontSize='xs'
              color={
                l.type === 'info'
                  ? 'base.500'
                  : l.type === 'success'
                    ? 'green.500'
                    : 'red.500'
              }
              m={0}
            >
              {l.message}
            </Text>
          ))}
        </Flex>
      )}
    </Flex>
  );
}
