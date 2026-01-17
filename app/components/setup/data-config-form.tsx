import { useState, useEffect } from 'react';
import {
  Button,
  Input,
  VStack,
  HStack,
  Text,
  Box,
  Field,
  Slider,
  NativeSelect
} from '@chakra-ui/react';
import { useCollections } from '@developmentseed/stac-react';

interface DataConfigFormProps {
  collectionId: string;
  temporalRange: [string, string];
  cloudCover?: number;
  isLoading?: boolean;
  onApply: (config: {
    collectionId: string;
    temporalRange: [string, string];
    cloudCover: number;
  }) => void;
  onCancel?: () => void;
  showActions?: boolean;
}

export function DataConfigForm({
  collectionId,
  temporalRange,
  cloudCover = 100,
  isLoading = false,
  onApply,
  onCancel,
  showActions = true
}: DataConfigFormProps) {
  // Fetch available collections
  const { collections, isLoading: collectionsLoading } = useCollections();

  // Local state for form
  const [localCollection, setLocalCollection] = useState(collectionId);
  const [localStartDate, setLocalStartDate] = useState(temporalRange[0]);
  const [localEndDate, setLocalEndDate] = useState(temporalRange[1]);
  const [localCloudCover, setLocalCloudCover] = useState(cloudCover);
  const [showValidation, setShowValidation] = useState(false);

  // Sync with props when they change
  useEffect(() => {
    setLocalCollection(collectionId);
    setLocalStartDate(temporalRange[0]);
    setLocalEndDate(temporalRange[1]);
    setLocalCloudCover(cloudCover);
  }, [collectionId, temporalRange, cloudCover]);

  // Validation
  const isStartDateValid = () => {
    if (!localStartDate) return false;
    const start = new Date(localStartDate);
    return !isNaN(start.getTime());
  };

  const isEndDateValid = () => {
    if (!localEndDate) return false;
    const end = new Date(localEndDate);
    return !isNaN(end.getTime());
  };

  const isDateRangeValid = () => {
    if (!isStartDateValid() || !isEndDateValid()) return false;
    const start = new Date(localStartDate);
    const end = new Date(localEndDate);
    return start <= end;
  };

  const isEndDateBeforeStart = () => {
    if (!isStartDateValid() || !isEndDateValid()) return false;
    return new Date(localStartDate) > new Date(localEndDate);
  };

  const collectionChanged = localCollection !== collectionId;

  const handleApply = () => {
    setShowValidation(true);
    if (!isDateRangeValid() || !localCollection) return;

    onApply({
      collectionId: localCollection,
      temporalRange: [localStartDate, localEndDate],
      cloudCover: localCloudCover
    });
  };

  const handleCancel = () => {
    // Reset local state
    setLocalCollection(collectionId);
    setLocalStartDate(temporalRange[0]);
    setLocalEndDate(temporalRange[1]);
    setShowValidation(false);
    setLocalCloudCover(cloudCover);
    onCancel?.();
  };

  return (
    <VStack gap={6} align='stretch'>
      {/* Collection Selector */}
      <Field.Root invalid={showValidation && !localCollection}>
        <Field.Label htmlFor='collection'>Collection</Field.Label>
        <NativeSelect.Root size='sm' disabled={collectionsLoading}>
          <NativeSelect.Field
            id='collection'
            value={localCollection}
            placeholder='Select a collection...'
            onChange={(e) => setLocalCollection(e.target.value)}
          >
            {collections?.collections?.map((collection) => (
              <option key={collection.id} value={collection.id}>
                {collection.title || collection.id}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
        {collectionId && collectionChanged && (
          <Field.HelperText color='orange.600'>
            ⚠️ Changing collection will reset band selections
          </Field.HelperText>
        )}
        {showValidation && !localCollection && (
          <Field.ErrorText>Please select a collection</Field.ErrorText>
        )}
      </Field.Root>

      {/* Temporal Range */}
      <VStack gap={3} align='stretch'>
        <Text fontSize='sm'>Temporal Range</Text>
        <HStack gap={3}>
          <VStack gap={1} align='stretch' flex={1}>
            <Field.Root invalid={showValidation && !isStartDateValid()}>
              <Field.Label htmlFor='start-date' fontSize='xs'>
                Start Date
              </Field.Label>
              <Input
                id='start-date'
                type='date'
                value={localStartDate}
                onChange={(e) => setLocalStartDate(e.target.value)}
                max={localEndDate}
              />
              {showValidation && !isStartDateValid() && (
                <Field.ErrorText>Please select a start date</Field.ErrorText>
              )}
            </Field.Root>
          </VStack>
          <Text color='gray.400' pt={5}>
            to
          </Text>
          <VStack gap={1} align='stretch' flex={1}>
            <Field.Root
              invalid={
                showValidation &&
                (!isEndDateValid() ||
                  (isStartDateValid() &&
                    isEndDateValid() &&
                    isEndDateBeforeStart()))
              }
            >
              <Field.Label htmlFor='end-date' fontSize='xs'>
                End Date
              </Field.Label>
              <Input
                id='end-date'
                type='date'
                value={localEndDate}
                onChange={(e) => setLocalEndDate(e.target.value)}
                min={localStartDate}
              />
              {showValidation && !isEndDateValid() && (
                <Field.ErrorText>Please select an end date</Field.ErrorText>
              )}
              {showValidation &&
                isEndDateValid() &&
                isStartDateValid() &&
                isEndDateBeforeStart() && (
                  <Field.ErrorText>
                    Start date must be before end date
                  </Field.ErrorText>
                )}
            </Field.Root>
          </VStack>
        </HStack>
      </VStack>
      {/* Cloud Cover */}
      <Field.Root>
        <Field.Label htmlFor='cloud-cover'>Maximum Cloud Cover</Field.Label>
        <HStack gap={4} width='full'>
          <Box flex={1} maxWidth='300px'>
            <Slider.Root
              value={[localCloudCover]}
              onValueChange={(details) => setLocalCloudCover(details.value[0])}
              min={0}
              max={100}
              step={5}
              disabled={true} // TODO: disabled while backend support is added
            >
              <Slider.Control>
                <Slider.Track>
                  <Slider.Range />
                </Slider.Track>
                <Slider.Thumb index={0} />
              </Slider.Control>
            </Slider.Root>
          </Box>
          <Text fontSize='sm' fontWeight='medium' minWidth='45px'>
            {localCloudCover}%
          </Text>
        </HStack>
        <Field.HelperText>
          Filter scenes by cloud cover percentage
        </Field.HelperText>
      </Field.Root>

      {/* Action Buttons */}
      {showActions && (
        <HStack justify='flex-end' gap={2} pt={2}>
          {onCancel && (
            <Button variant='ghost' onClick={handleCancel} disabled={isLoading}>
              Cancel
            </Button>
          )}
          <Button
            colorPalette='blue'
            onClick={handleApply}
            disabled={isLoading}
            loading={isLoading}
          >
            {collectionId && collectionChanged && '⚠️ '}Apply Changes
          </Button>
        </HStack>
      )}
    </VStack>
  );
}
