import { Alert, ProgressCircle, Box, Button, Text } from '@chakra-ui/react';
import type { TileLoadStatus } from './use-map-tile-status';

interface TileStatusAlertProps {
  status: TileLoadStatus;
  /** Asks the assistant about the tile error. Absent when no assistant is configured. */
  onAsk?: () => void;
}

export function TileStatusAlert({ status, onAsk }: TileStatusAlertProps) {
  if (status.status === 'idle') return null;

  if (status.status === 'error' && status.error) {
    const { error, failed = 1 } = status;
    return (
      <Box position='absolute' left={4} right={4} bottom={4} zIndex={10}>
        <Alert.Root status='error' variant='subtle' size='sm' maxW='lg'>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>
              {failed > 1 ? `${failed} tiles failed` : 'A tile failed'}:{' '}
              {error.code}
            </Alert.Title>
            <Alert.Description>
              {error.advice && <Text>{error.advice}</Text>}
              <Text fontSize='xs' color='fg.muted' wordBreak='break-word'>
                {error.message}
              </Text>
            </Alert.Description>
            {onAsk && (
              <Button size='xs' variant='outline' mt={2} onClick={onAsk}>
                Ask the assistant
              </Button>
            )}
          </Alert.Content>
        </Alert.Root>
      </Box>
    );
  }

  const isLoading = status.status === 'loading';
  const alertStatus = isLoading ? 'info' : 'warning';

  return (
    <Box position='absolute' left={4} bottom={4} zIndex={10}>
      <Alert.Root status={alertStatus} variant='solid' size='sm' gap={3}>
        <Alert.Indicator>
          {isLoading && (
            <ProgressCircle.Root value={null} size='xs'>
              <ProgressCircle.Circle>
                <ProgressCircle.Track />
                <ProgressCircle.Range strokeLinecap='round' />
              </ProgressCircle.Circle>
            </ProgressCircle.Root>
          )}
        </Alert.Indicator>
        <Alert.Content>
          <Alert.Title>
            {isLoading ? 'Processing…' : 'No tiles returned for this view'}
          </Alert.Title>
        </Alert.Content>
      </Alert.Root>
    </Box>
  );
}
