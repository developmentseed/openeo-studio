import { Alert, ProgressCircle, Box } from '@chakra-ui/react';
import type { TileLoadStatus } from './use-map-tile-status';

interface TileStatusAlertProps {
  status: TileLoadStatus;
}

function getAlertContent(status: TileLoadStatus) {
  switch (status.status) {
    case 'loading':
      return { alertStatus: 'info' as const, title: 'Loading...' };
    case 'warning':
      return {
        alertStatus: 'warning' as const,
        title: 'No tiles returned for this view'
      };
    case 'error':
      return status.reason === 'no-data'
        ? {
            alertStatus: 'error' as const,
            title: 'No data available for this area and time range',
            description:
              'Change the spatial or temporal extent of load_collection, or move the map to an area that has data.'
          }
        : {
            alertStatus: 'error' as const,
            title: 'Tiles failed to load',
            description: status.message
          };
    default:
      return null;
  }
}

export function TileStatusAlert({ status }: TileStatusAlertProps) {
  const content = getAlertContent(status);
  if (!content) return null;

  const isLoading = status.status === 'loading';

  return (
    <Box position='absolute' left={4} bottom={4} zIndex={10} maxW='md'>
      <Alert.Root
        status={content.alertStatus}
        variant='solid'
        size='sm'
        gap={3}
      >
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
          <Alert.Title>{content.title}</Alert.Title>
          {content.description && (
            <Alert.Description>{content.description}</Alert.Description>
          )}
        </Alert.Content>
      </Alert.Root>
    </Box>
  );
}
