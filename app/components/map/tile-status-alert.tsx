import { Alert, ProgressCircle, Box, Text } from '@chakra-ui/react';
import type { TileLoadStatus } from './use-map-tile-status';

interface TileStatusAlertProps {
  status: TileLoadStatus;
}

export function TileStatusAlert({ status }: TileStatusAlertProps) {
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
