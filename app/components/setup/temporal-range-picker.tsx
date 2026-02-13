import { useState, useEffect } from 'react';
import { Input, VStack, HStack, Text, Field } from '@chakra-ui/react';

interface TemporalRangePickerProps {
  temporalRange: [string, string];
  onTemporalRangeChange: (temporalRange: [string, string]) => void;
}

export function TemporalRangePicker({
  temporalRange,
  onTemporalRangeChange
}: TemporalRangePickerProps) {
  // Local state for temporal range to allow typing
  const [localTemporalRange, setLocalTemporalRange] =
    useState<[string, string]>(temporalRange);

  // Sync local state with props when they change externally
  useEffect(() => {
    if (
      localTemporalRange[0] !== temporalRange[0] ||
      localTemporalRange[1] !== temporalRange[1]
    ) {
      setLocalTemporalRange(temporalRange);
    }
  }, [temporalRange, localTemporalRange]);

  // Validation helpers
  const isStartDateValid = () => {
    if (!localTemporalRange[0]) return false;
    const start = new Date(localTemporalRange[0]);
    return !isNaN(start.getTime());
  };

  const isEndDateValid = () => {
    if (!localTemporalRange[1]) return false;
    const end = new Date(localTemporalRange[1]);
    return !isNaN(end.getTime());
  };

  const isEndDateBeforeStart = () => {
    if (!isStartDateValid() || !isEndDateValid()) return false;
    return new Date(localTemporalRange[0]) > new Date(localTemporalRange[1]);
  };

  const isValidTemporalRange = (start: string, end: string): boolean => {
    if (!start || !end) return false;
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return false;
    return startDate <= endDate;
  };

  const handleStartDateChange = (value: string) => {
    const newRange: [string, string] = [value, localTemporalRange[1]];
    setLocalTemporalRange(newRange);

    // Sync to parent only when valid
    if (isValidTemporalRange(value, localTemporalRange[1])) {
      onTemporalRangeChange(newRange);
    }
  };

  const handleEndDateChange = (value: string) => {
    const newRange: [string, string] = [localTemporalRange[0], value];
    setLocalTemporalRange(newRange);

    // Sync to parent only when valid
    if (isValidTemporalRange(localTemporalRange[0], value)) {
      onTemporalRangeChange(newRange);
    }
  };

  return (
    <VStack gap={3} align='stretch'>
      <Text fontSize='sm' fontWeight='medium'>
        Temporal Range
      </Text>
      <HStack gap={3}>
        <VStack gap={1} align='stretch' flex={1}>
          <Field.Root invalid={!isStartDateValid()}>
            <Field.Label htmlFor='start-date' fontSize='xs'>
              Start Date
            </Field.Label>
            <Input
              id='start-date'
              type='date'
              value={localTemporalRange[0]}
              onChange={(e) => handleStartDateChange(e.target.value)}
              max={localTemporalRange[1]}
            />
            {!isStartDateValid() && (
              <Field.ErrorText>Please select a start date</Field.ErrorText>
            )}
          </Field.Root>
        </VStack>
        <Text color='gray.400' pt={5}>
          to
        </Text>
        <VStack gap={1} align='stretch' flex={1}>
          <Field.Root invalid={!isEndDateValid() || isEndDateBeforeStart()}>
            <Field.Label htmlFor='end-date' fontSize='xs'>
              End Date
            </Field.Label>
            <Input
              id='end-date'
              type='date'
              value={localTemporalRange[1]}
              onChange={(e) => handleEndDateChange(e.target.value)}
              min={localTemporalRange[0]}
            />
            {!isEndDateValid() && (
              <Field.ErrorText>Please select an end date</Field.ErrorText>
            )}
            {isEndDateValid() &&
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
  );
}
