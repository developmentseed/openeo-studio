import { Alert, Box, CloseButton, Code, Text } from '@chakra-ui/react';
import { useCollection } from '@developmentseed/stac-react';
import type { StacCollection } from 'stac-ts';

import { collectionBandIdentifiers } from '$utils/stac-band-parser';
import type { PrefillState } from './use-prefill-sample';

interface PrefillSampleAlertProps {
  state: PrefillState;
  onDismiss: () => void;
}

/**
 * The bands of the sample that the collection does not have. The band
 * builder removes them without a message, so the alert tells the user.
 * Empty while the collection loads.
 */
function useMissingBands(state: PrefillState): {
  missing: string[];
  available: string[];
} {
  const collectionId = state.status === 'loaded' ? state.collectionId : '';
  const { collection } = useCollection(collectionId);
  const identifiers = collectionBandIdentifiers(
    collection as unknown as StacCollection | null
  );

  if (state.status !== 'loaded' || identifiers.size === 0) {
    return { missing: [], available: [] };
  }
  return {
    missing: state.bands.filter((band) => !identifiers.has(band)),
    available: [...identifiers]
  };
}

/**
 * Tells the user that the code comes from an external link. The code runs
 * in the browser of the user, with access to the session, so the user must
 * read it before the first run.
 */
export function PrefillSampleAlert({
  state,
  onDismiss
}: PrefillSampleAlertProps) {
  const { missing, available } = useMissingBands(state);

  if (state.status !== 'loaded' && state.status !== 'error') return null;

  const isError = state.status === 'error';

  return (
    <Box mb={2}>
      <Alert.Root status={isError ? 'error' : 'warning'} size='sm'>
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>
            {isError
              ? 'Cannot load the sample'
              : `This sample comes from ${state.source}`}
          </Alert.Title>
          <Alert.Description>
            {isError
              ? state.message
              : 'Read the code before you click Run. The code runs in your browser, in your session.'}
            {state.status === 'loaded' && missing.length > 0 && (
              <Text mt={1}>
                The collection <Code size='sm'>{state.collectionId}</Code> has
                no band {missing.map((band) => `"${band}"`).join(', ')}. Studio
                removed {missing.length > 1 ? 'these bands' : 'this band'}.
                Select the bands in the Configuration tab, in the order that the
                code uses. The collection has:{' '}
                {available.slice(0, 20).join(', ')}
                {available.length > 20 ? ', …' : ''}.
              </Text>
            )}
          </Alert.Description>
        </Alert.Content>
        <CloseButton
          size='2xs'
          alignSelf='flex-start'
          aria-label='Dismiss'
          onClick={onDismiss}
        />
      </Alert.Root>
    </Box>
  );
}
