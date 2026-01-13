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
  NativeSelectRoot,
  NativeSelectField
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

  // Sync with props when they change
  useEffect(() => {
    setLocalCollection(collectionId);
    setLocalStartDate(temporalRange[0]);
    setLocalEndDate(temporalRange[1]);
    setLocalCloudCover(cloudCover);
  }, [collectionId, temporalRange, cloudCover]);

  // Validation
  const isDateValid = () => {
    if (!localStartDate || !localEndDate) return false;
    const start = new Date(localStartDate);
    const end = new Date(localEndDate);
    return start <= end && !isNaN(start.getTime()) && !isNaN(end.getTime());
  };

  const hasChanges = () => {
    return (
      localCollection !== collectionId ||
      localStartDate !== temporalRange[0] ||
      localEndDate !== temporalRange[1] ||
      localCloudCover !== cloudCover
    );
  };

  const collectionChanged = localCollection !== collectionId;

  const handleApply = () => {
    if (!isDateValid()) return;

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
    setLocalCloudCover(cloudCover);
    onCancel?.();
  };

  return (
    <VStack gap={6} align='stretch'>
      {/* Collection Selector */}
      <Field.Root>
        <Field.Label htmlFor='collection'>Collection</Field.Label>
        <NativeSelectRoot size='sm' disabled={collectionsLoading}>
          <NativeSelectField
            id='collection'
            value={localCollection}
            onChange={(e) => setLocalCollection(e.target.value)}
          >
            {collections?.collections?.map((collection) => (
              <option key={collection.id} value={collection.id}>
                {collection.title || collection.id}
              </option>
            ))}
          </NativeSelectField>
        </NativeSelectRoot>
        {collectionChanged && (
          <Field.HelperText color='orange.600'>
            ⚠️ Changing collection will reset band selections
          </Field.HelperText>
        )}
      </Field.Root>

      {/* Temporal Range */}
      <Field.Root invalid={!isDateValid()}>
        <Field.Label>Temporal Range</Field.Label>
        <HStack gap={3}>
          <VStack gap={1} align='stretch' flex={1}>
            <Text fontSize='xs' color='gray.600'>
              Start Date
            </Text>
            <Input
              type='date'
              value={localStartDate}
              onChange={(e) => setLocalStartDate(e.target.value)}
              max={localEndDate}
            />
          </VStack>
          <Text color='gray.400' pt={5}>
            to
          </Text>
          <VStack gap={1} align='stretch' flex={1}>
            <Text fontSize='xs' color='gray.600'>
              End Date
            </Text>
            <Input
              type='date'
              value={localEndDate}
              onChange={(e) => setLocalEndDate(e.target.value)}
              min={localStartDate}
            />
          </VStack>
        </HStack>
        {!isDateValid() && (
          <Field.ErrorText>Please enter a valid date range</Field.ErrorText>
        )}
      </Field.Root>

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
            disabled={!isDateValid() || !hasChanges() || isLoading}
            loading={isLoading}
          >
            {collectionChanged && '⚠️ '}Apply Changes
          </Button>
        </HStack>
      )}
    </VStack>
  );
}
