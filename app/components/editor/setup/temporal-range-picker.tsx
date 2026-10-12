import { useState, useEffect } from 'react';
import {
  DatePicker,
  type DateValue,
  Field,
  parseDate,
  Portal,
  SimpleGrid
} from '@chakra-ui/react';
import { LuCalendar } from 'react-icons/lu';

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
    setLocalTemporalRange(temporalRange);
  }, [temporalRange]);

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
    <SimpleGrid columns={2} gap={4}>
      <Field.Root required invalid={!isStartDateValid()}>
        <DateField
          label='Date start'
          value={localTemporalRange[0]}
          onChange={handleStartDateChange}
          max={localTemporalRange[1]}
          invalid={!isStartDateValid()}
        />
        {!isStartDateValid() && (
          <Field.ErrorText>Please select a start date</Field.ErrorText>
        )}
      </Field.Root>
      <Field.Root
        required
        invalid={!isEndDateValid() || isEndDateBeforeStart()}
      >
        <DateField
          label='Date end'
          value={localTemporalRange[1]}
          onChange={handleEndDateChange}
          min={localTemporalRange[0]}
          invalid={!isEndDateValid() || isEndDateBeforeStart()}
        />
        {!isEndDateValid() && (
          <Field.ErrorText>Please select an end date</Field.ErrorText>
        )}
        {isEndDateValid() && isStartDateValid() && isEndDateBeforeStart() && (
          <Field.ErrorText>Start date must be before end date</Field.ErrorText>
        )}
      </Field.Root>
    </SimpleGrid>
  );
}

/**
 * Parses a date string into a calendar date. Only the date part is used, so
 * full ISO datetimes are accepted too.
 */
function toDateValue(value?: string): DateValue | undefined {
  if (!value) return undefined;
  try {
    return parseDate(value.slice(0, 10));
  } catch {
    return undefined;
  }
}

interface DateFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  invalid: boolean;
  min?: string;
  max?: string;
}

/**
 * Single date picker with the calendar trigger at the start of the input.
 * Values go in and out as YYYY-MM-DD strings.
 */
function DateField({
  label,
  value,
  onChange,
  invalid,
  min,
  max
}: DateFieldProps) {
  const dateValue = toDateValue(value);

  return (
    <DatePicker.Root
      size='sm'
      required
      invalid={invalid}
      openOnClick
      locale={navigator.language}
      value={dateValue ? [dateValue] : []}
      onValueChange={(details) => onChange(details.value[0]?.toString() ?? '')}
      min={toDateValue(min)}
      max={toDateValue(max)}
      gap={1.5}
    >
      <DatePicker.Label>
        {label} <Field.RequiredIndicator />
      </DatePicker.Label>
      <DatePicker.Control>
        <DatePicker.Input ps={9} />
        <DatePicker.IndicatorGroup
          insetStart='var(--datepicker-indicators-offset)'
          insetEnd='auto'
        >
          <DatePicker.Trigger>
            <LuCalendar />
          </DatePicker.Trigger>
        </DatePicker.IndicatorGroup>
      </DatePicker.Control>
      <Portal>
        <DatePicker.Positioner>
          <DatePicker.Content>
            <DatePicker.View view='day'>
              <DatePicker.Header />
              <DatePicker.DayTable />
            </DatePicker.View>
            <DatePicker.View view='month'>
              <DatePicker.Header />
              <DatePicker.MonthTable />
            </DatePicker.View>
            <DatePicker.View view='year'>
              <DatePicker.Header />
              <DatePicker.YearTable />
            </DatePicker.View>
          </DatePicker.Content>
        </DatePicker.Positioner>
      </Portal>
    </DatePicker.Root>
  );
}
