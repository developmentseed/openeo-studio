import { Alert, ProgressCircle, Box } from '@chakra-ui/react';
import type { TileLoadStatus } from './use-map-tile-status';

interface TileStatusAlertProps {
  status: TileLoadStatus;
}

export function TileStatusAlert({ status }: TileStatusAlertProps) {
  if (status.status === 'idle') return null;

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
            {isLoading ? 'Loading...' : 'No tiles returned for this view'}
          </Alert.Title>
        </Alert.Content>
      </Alert.Root>
    </Box>
  );
}
