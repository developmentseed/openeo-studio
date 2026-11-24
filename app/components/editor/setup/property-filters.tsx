import { useMemo, useState } from 'react';
import {
  Box,
  Combobox,
  createListCollection,
  Field,
  Flex,
  IconButton,
  Input,
  NativeSelect,
  NumberInput,
  Portal,
  SegmentGroup,
  Slider,
  Text,
  VStack
} from '@chakra-ui/react';
import { LuX } from 'react-icons/lu';

import {
  createFilter,
  getFilterableQueryables,
  getOperatorsForKind,
  getQueryableKind,
  getQueryableLabel,
  isBounded,
  type CollectionQueryables,
  type QueryableKind,
  type QueryableSchema
} from '$utils/openeo/queryables';
import type { PropertyFilter, PropertyFilterOperator } from '$types';

const NUMBER_OPERATOR_LABELS: Record<PropertyFilterOperator, string> = {
  lt: '< less than',
  lte: '≤ at most',
  gt: '> more than',
  gte: '≥ at least',
  eq: '= equal to',
  neq: '≠ not equal to'
};

const OPERATOR_LABELS: Record<PropertyFilterOperator, string> = {
  ...NUMBER_OPERATOR_LABELS,
  eq: 'is',
  neq: 'is not'
};

interface PropertyFiltersProps {
  queryables: CollectionQueryables;
  filters: PropertyFilter[];
  onChange: (filters: PropertyFilter[]) => void;
}

/**
 * `load_collection` property filters (e.g. cloud cover) on the queryables of
 * the collection.
 */
export function PropertyFilters({
  queryables,
  filters,
  onChange
}: PropertyFiltersProps) {
  const available = useMemo(
    () =>
      getFilterableQueryables(queryables).filter(
        ([property]) => !filters.some((filter) => filter.property === property)
      ),
    [queryables, filters]
  );

  const updateFilter = (index: number, patch: Partial<PropertyFilter>) =>
    onChange(
      filters.map((filter, i) =>
        i === index ? { ...filter, ...patch } : filter
      )
    );

  return (
    <VStack align='stretch' gap={2}>
      <Text fontSize='sm' fontWeight='medium'>
        Property filters
      </Text>

      {available.length > 0 && (
        <AddFilterCombobox
          available={available}
          onAdd={(property) =>
            onChange([createFilter(property, queryables[property]), ...filters])
          }
        />
      )}

      {filters.length === 0 && (
        <Flex
          align='center'
          gap={2}
          p={2}
          borderWidth='1px'
          borderStyle='dashed'
          borderColor='border'
          borderRadius='md'
          color='fg.muted'
        >
          <Box>
            <Text fontSize='sm' fontWeight='medium' color='fg'>
              No filters applied
            </Text>
            <Text fontSize='xs'>Every item of the collection is used.</Text>
          </Box>
        </Flex>
      )}

      {filters.map((filter, index) => {
        const schema = queryables[filter.property];
        const kind = schema && getQueryableKind(schema);
        if (!kind) return null;

        return (
          <FilterCard
            key={filter.property}
            filter={filter}
            schema={schema}
            kind={kind}
            onChange={(patch) => updateFilter(index, patch)}
            onRemove={() => onChange(filters.filter((_, i) => i !== index))}
          />
        );
      })}
    </VStack>
  );
}

interface FilterCardProps {
  filter: PropertyFilter;
  schema: QueryableSchema;
  kind: QueryableKind;
  onChange: (patch: Partial<PropertyFilter>) => void;
  onRemove: () => void;
}

function FilterCard({
  filter,
  schema,
  kind,
  onChange,
  onRemove
}: FilterCardProps) {
  const label = getQueryableLabel(filter.property, schema);
  const operators = getOperatorsForKind(kind);
  const operatorLabels =
    kind === 'number' ? NUMBER_OPERATOR_LABELS : OPERATOR_LABELS;

  return (
    <Box borderWidth='1px' borderColor='border' borderRadius='md' p={3}>
      <Flex align='start' gap={2} mb={2}>
        <Box flex={1} minW={0} title={schema.description}>
          <Text fontSize='sm' fontWeight='medium' truncate>
            {label}
          </Text>
          {label !== filter.property && (
            <Text fontSize='xs' fontFamily='mono' color='fg.muted' truncate>
              {filter.property}
            </Text>
          )}
        </Box>
        <IconButton
          aria-label={`Remove ${label} filter`}
          size='xs'
          variant='ghost'
          onClick={onRemove}
        >
          <LuX />
        </IconButton>
      </Flex>

      <Flex align='start' gap={2}>
        {operators.length > 1 ? (
          <NativeSelect.Root
            size='sm'
            width={kind === 'number' ? '8.5rem' : '6rem'}
            flexShrink={0}
          >
            <NativeSelect.Field
              aria-label={`${label} operator`}
              value={filter.operator}
              onChange={(e) =>
                onChange({
                  operator: e.target.value as PropertyFilterOperator
                })
              }
            >
              {operators.map((operator) => (
                <option key={operator} value={operator}>
                  {operatorLabels[operator]}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        ) : (
          <Text fontSize='sm' color='fg.muted' lineHeight='2.25rem' px={1}>
            {operatorLabels[filter.operator]}
          </Text>
        )}
        <FilterValue
          label={label}
          schema={schema}
          kind={kind}
          value={filter.value}
          onChange={(value) => onChange({ value })}
        />
      </Flex>
    </Box>
  );
}

interface FilterValueProps {
  label: string;
  schema: QueryableSchema;
  kind: QueryableKind;
  value: PropertyFilter['value'];
  onChange: (value: PropertyFilter['value']) => void;
}

function FilterValue({
  label,
  schema,
  kind,
  value,
  onChange
}: FilterValueProps) {
  const ariaLabel = `${label} value`;

  if (schema.enum?.length) {
    return (
      <NativeSelect.Root size='sm' flex={1} minW={0}>
        <NativeSelect.Field
          aria-label={ariaLabel}
          value={String(value)}
          onChange={(e) =>
            onChange(
              schema.enum!.find(
                (option) => String(option) === e.target.value
              ) ?? e.target.value
            )
          }
        >
          {schema.enum.map((option) => (
            <option key={String(option)} value={String(option)}>
              {String(option)}
            </option>
          ))}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
    );
  }

  if (kind === 'boolean') {
    return (
      <SegmentGroup.Root
        size='sm'
        aria-label={ariaLabel}
        value={String(value)}
        onValueChange={(details) => onChange(details.value === 'true')}
      >
        <SegmentGroup.Indicator />
        <SegmentGroup.Items
          items={[
            { value: 'true', label: 'True' },
            { value: 'false', label: 'False' }
          ]}
        />
      </SegmentGroup.Root>
    );
  }

  if (kind === 'number') {
    const isInteger = [schema.type].flat().includes('integer');
    const numberInput = (
      <NumberInput.Root
        size='sm'
        width={isBounded(schema) ? '5rem' : undefined}
        flex={isBounded(schema) ? undefined : 1}
        flexShrink={0}
        min={schema.minimum}
        max={schema.maximum}
        step={isInteger ? 1 : undefined}
        clampValueOnBlur
        value={String(value)}
        onValueChange={(details) => {
          if (!isNaN(details.valueAsNumber)) onChange(details.valueAsNumber);
        }}
      >
        <NumberInput.Input aria-label={ariaLabel} />
      </NumberInput.Root>
    );

    if (!isBounded(schema)) return numberInput;

    return (
      <Flex flex={1} minW={0} align='center' gap={3}>
        <Slider.Root
          flex={1}
          minW={0}
          aria-label={[`${label} slider`]}
          value={[Number(value)]}
          onValueChange={(details) => onChange(details.value[0])}
          min={schema.minimum}
          max={schema.maximum}
          step={isInteger ? 1 : (schema.maximum - schema.minimum) / 100}
          variant='solid'
          size='sm'
        >
          <Slider.Control>
            <Slider.Track>
              <Slider.Range />
            </Slider.Track>
            <Slider.Thumb index={0} />
          </Slider.Control>
        </Slider.Root>
        {numberInput}
      </Flex>
    );
  }

  // An empty string matches no item: flag it until the user types a value.
  return (
    <Field.Root flex={1} minW={0} invalid={value === ''}>
      <Input
        size='sm'
        aria-label={ariaLabel}
        placeholder='Value'
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
      />
      <Field.ErrorText>Enter a value</Field.ErrorText>
    </Field.Root>
  );
}

/** Short hint of the values a queryable takes, shown in the add list. */
function describeQueryable(schema: QueryableSchema, kind: QueryableKind) {
  if (schema.enum?.length) {
    return schema.enum.length === 1
      ? '1 option'
      : `${schema.enum.length} options`;
  }
  if (kind === 'number' && isBounded(schema)) {
    return `${schema.minimum}–${schema.maximum}`;
  }
  return kind === 'string' ? 'text' : kind;
}

interface AddFilterItem {
  property: string;
  label: string;
  hint: string;
}

interface AddFilterComboboxProps {
  available: [string, QueryableSchema][];
  onAdd: (property: string) => void;
}

/** Searchable list of the queryables without a filter. */
function AddFilterCombobox({ available, onAdd }: AddFilterComboboxProps) {
  const [query, setQuery] = useState('');

  const collection = useMemo(() => {
    const search = query.trim().toLowerCase();
    return createListCollection<AddFilterItem>({
      items: available
        .map(([property, schema]) => ({
          property,
          label: getQueryableLabel(property, schema),
          hint: describeQueryable(schema, getQueryableKind(schema)!)
        }))
        .filter(
          (item) =>
            item.label.toLowerCase().includes(search) ||
            item.property.toLowerCase().includes(search)
        ),
      itemToValue: (item) => item.property,
      itemToString: (item) => item.label
    });
  }, [available, query]);

  return (
    <Combobox.Root
      size='sm'
      collection={collection}
      value={[]}
      inputValue={query}
      onInputValueChange={(details) => setQuery(details.inputValue)}
      onValueChange={(details) => {
        const [property] = details.value;
        if (property) onAdd(property);
        setQuery('');
      }}
      openOnClick
      inputBehavior='autohighlight'
      selectionBehavior='clear'
    >
      <Combobox.Control>
        <Combobox.Input
          aria-label='Add property filter'
          placeholder='Add a filter…'
        />
        <Combobox.IndicatorGroup>
          <Combobox.Trigger />
        </Combobox.IndicatorGroup>
      </Combobox.Control>
      <Portal>
        <Combobox.Positioner>
          <Combobox.Content>
            <Combobox.Empty>No matching filter</Combobox.Empty>
            {collection.items.map((item) => (
              <Combobox.Item key={item.property} item={item}>
                <Box flex={1} minW={0}>
                  <Combobox.ItemText truncate>{item.label}</Combobox.ItemText>
                  {item.label !== item.property && (
                    <Text
                      fontSize='xs'
                      fontFamily='mono'
                      color='fg.muted'
                      truncate
                    >
                      {item.property}
                    </Text>
                  )}
                </Box>
                <Text fontSize='xs' color='fg.muted' flexShrink={0}>
                  {item.hint}
                </Text>
              </Combobox.Item>
            ))}
          </Combobox.Content>
        </Combobox.Positioner>
      </Portal>
    </Combobox.Root>
  );
}
