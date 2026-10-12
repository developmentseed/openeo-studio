import {
  Alert,
  Button,
  Flex,
  Heading,
  Icon,
  List,
  Progress,
  Spinner,
  Text
} from '@chakra-ui/react';
import { LuCheck, LuCircle, LuRotateCw, LuX } from 'react-icons/lu';

import {
  PYTHON_SETUP_STEPS,
  type PythonSetupStepStatus,
  usePyodide
} from '$stores/pyodide-store';

/**
 * Shows the progress of the Python environment setup, with a retry when it
 * fails.
 */
export function PythonSetupPanel() {
  const { status, steps, error, retry } = usePyodide();

  // The active step counts as half done, so the bar moves during the first
  // and longest step.
  const progress = PYTHON_SETUP_STEPS.reduce(
    (sum, { id }) =>
      sum + (steps[id] === 'done' ? 1 : steps[id] === 'active' ? 0.5 : 0),
    0
  );
  const isError = status === 'error';

  return (
    <Flex flex={1} align='center' justify='center' p={6}>
      <Flex direction='column' gap={5} w='full' maxW='sm'>
        <Flex direction='column' gap={1}>
          <Heading as='h2' size='md'>
            {isError ? 'Python setup failed' : 'Setting up Python'}
          </Heading>
          <Text fontSize='sm' color='fg.muted'>
            The editor runs Python in your browser. The first visit takes the
            longest; later visits load from the browser cache.
          </Text>
        </Flex>

        <Progress.Root
          value={(progress / PYTHON_SETUP_STEPS.length) * 100}
          size='sm'
          colorPalette={isError ? 'red' : 'primary'}
          striped={!isError}
          animated={!isError}
          aria-label='Python setup progress'
        >
          <Progress.Track>
            <Progress.Range />
          </Progress.Track>
        </Progress.Root>

        <List.Root variant='plain' gap={3} aria-live='polite'>
          {PYTHON_SETUP_STEPS.map(({ id, label }) => (
            <List.Item key={id} alignItems='center' gap={3}>
              <StepIcon status={steps[id]} />
              <Text
                fontSize='sm'
                color={steps[id] === 'pending' ? 'fg.muted' : 'fg'}
                fontWeight={steps[id] === 'active' ? 'medium' : 'normal'}
              >
                {label}
              </Text>
            </List.Item>
          ))}
        </List.Root>

        {isError && (
          <Alert.Root status='error' size='sm'>
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description wordBreak='break-word'>
                {error}
              </Alert.Description>
            </Alert.Content>
          </Alert.Root>
        )}
        {isError && (
          <Button size='sm' alignSelf='flex-start' onClick={retry}>
            <LuRotateCw />
            Try again
          </Button>
        )}
      </Flex>
    </Flex>
  );
}

const statusText: Record<PythonSetupStepStatus, string> = {
  pending: 'Waiting',
  active: 'Loading',
  done: 'Done',
  error: 'Failed'
};

function StepIcon({ status }: { status: PythonSetupStepStatus }) {
  return (
    <Flex
      boxSize={5}
      align='center'
      justify='center'
      flexShrink={0}
      role='img'
      aria-label={statusText[status]}
    >
      {status === 'active' && <Spinner size='sm' color='primary.solid' />}
      {status === 'done' && (
        <Icon color='fg.success' boxSize={4}>
          <LuCheck />
        </Icon>
      )}
      {status === 'error' && (
        <Icon color='fg.error' boxSize={4}>
          <LuX />
        </Icon>
      )}
      {status === 'pending' && (
        <Icon color='fg.subtle' boxSize={3}>
          <LuCircle />
        </Icon>
      )}
    </Flex>
  );
}
