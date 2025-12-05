import { Flex, Text } from '@chakra-ui/react';
import { usePyodide } from '$utils/code-runner';

export function OutputPanel() {
  const { log } = usePyodide();

  if (log.length === 0) {
    return null;
  }

  return (
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
  );
}
