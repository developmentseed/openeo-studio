import { Flex, Button, Text } from '@chakra-ui/react';
import { useAuth } from 'react-oidc-context';

interface EditorToolbarProps {
  executeCode: () => Promise<void>;
  isExecuting: boolean;
  isReady: boolean;
  showAutoExecHint?: boolean;
  hasCodeChanged: boolean;
}

export function EditorToolbar({
  executeCode,
  isExecuting,
  isReady,
  showAutoExecHint,
  hasCodeChanged
}: EditorToolbarProps) {
  const { isAuthenticated } = useAuth();

  return (
    <Flex
      justifyContent='space-between'
      alignItems='center'
      gap={3}
      px='lg'
      py='sm'
      borderTop='1px solid'
      borderColor='gray.200'
    >
      <Text fontSize='sm' color='gray.500'>
        {isExecuting && showAutoExecHint ? 'Running analysis…' : ''}
      </Text>
      <Flex alignItems='center' gap={3}>
        <Button
          size='sm'
          variant='outline'
          disabled={
            !isReady || isExecuting || !isAuthenticated || !hasCodeChanged
          }
          onClick={executeCode}
          loading={isExecuting}
        >
          Apply
          <svg
            version='1.1'
            xmlns='http://www.w3.org/2000/svg'
            width='16'
            height='16'
            viewBox='0 0 16 16'
          >
            <rect width='16' height='16' id='icon-bound' fill='none' />
            <path d='M2,9.014L3.414,7.6L6.004,10.189L12.593,3.6L14.007,5.014L6.003,13.017L2,9.014Z' />
          </svg>
        </Button>
      </Flex>
    </Flex>
  );
}
