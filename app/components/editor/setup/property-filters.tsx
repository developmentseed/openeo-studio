import { useMemo } from 'react';
import {
  Flex,
  IconButton,
  Input,
  NativeSelect,
  NumberInput,
  Text,
  VStack
} from '@chakra-ui/react';
import { LuX } from 'react-icons/lu';

import {
  getFilterableQueryables,
  getOperatorsForKind,
  getQueryableKind,
  type CollectionQueryables,
  type QueryableKind,
  type QueryableSchema
} from '$utils/openeo/queryables';
import type { PropertyFilter, PropertyFilterOperator } from '$types';

const OPERATOR_LABELS: Record<PropertyFilterOperator, string> = {
  lt: '<',
  lte: '≤',
  gt: '>',
  gte: '≥',
  eq: '=',
  neq: '≠'
};

interface PropertyFiltersProps {
  queryables: CollectionQueryables;
  filters: PropertyFilter[];
  onChange: (filters: PropertyFilter[]) => void;
}

function createFilter(
  property: string,
  schema: QueryableSchema,
  kind: QueryableKind
): PropertyFilter {
  if (schema.enum?.length) {
    return { property, operator: 'eq', value: schema.enum[0] };
  }
  if (kind === 'number') {
    return { property, operator: 'lte', value: schema.minimum ?? 0 };
  }
  if (kind === 'boolean') {
    return { property, operator: 'eq', value: true };
  }
  return { property, operator: 'eq', value: '' };
}

/**
 * Additional `load_collection` property filters, on the queryables of the
 * collection. Cloud cover is not part of these: it has its own control.
 */
export function PropertyFilters({
  queryables,
  filters,
  onChange
}: PropertyFiltersProps) {
  const filterable = useMemo(
    () => getFilterableQueryables(queryables),
    [queryables]
  );
  const available = filterable.filter(
    ([property]) => !filters.some((filter) => filter.property === property)
  );

  if (filterable.length === 0) return null;

  const updateFilter = (index: number, patch: Partial<PropertyFilter>) =>
    onChange(
      filters.map((filter, i) =>
        i === index ? { ...filter, ...patch } : filter
      )
    );

  const addFilter = (property: string) => {
    const schema = queryables[property];
    const kind = schema && getQueryableKind(schema);
    if (!kind) return;
    onChange([...filters, createFilter(property, schema, kind)]);
  };

  return (
    <VStack align='stretch' gap={2}>
      <Text fontSize='sm' fontWeight='medium'>
        Property filters
      </Text>

      {filters.map((filter, index) => {
        const schema = queryables[filter.property];
        const kind = schema && getQueryableKind(schema);
        if (!kind) return null;

        return (
          <Flex key={filter.property} gap={2} align='center'>
            <Text
              flex={1}
              minW={0}
              fontSize='sm'
              truncate
              title={schema.description ?? filter.property}
            >
              {schema.title ?? filter.property}
            </Text>
            <NativeSelect.Root size='sm' width='4.5rem' flexShrink={0}>
              <NativeSelect.Field
                aria-label={`${filter.property} operator`}
                value={filter.operator}
                onChange={(e) =>
                  updateFilter(index, {
                    operator: e.target.value as PropertyFilterOperator
                  })
                }
              >
                {getOperatorsForKind(kind).map((operator) => (
                  <option key={operator} value={operator}>
                    {OPERATOR_LABELS[operator]}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
            <FilterValueInput
              property={filter.property}
              schema={schema}
              kind={kind}
              value={filter.value}
              onChange={(value) => updateFilter(index, { value })}
            />
            <IconButton
              aria-label={`Remove ${filter.property} filter`}
              size='sm'
              variant='ghost'
              onClick={() => onChange(filters.filter((_, i) => i !== index))}
            >
              <LuX />
            </IconButton>
          </Flex>
        );
      })}

      {available.length > 0 && (
        <NativeSelect.Root size='sm'>
          <NativeSelect.Field
            aria-label='Add property filter'
            value=''
            onChange={(e) => addFilter(e.target.value)}
          >
            <option value='' disabled>
              Add filter…
            </option>
            {available.map(([property, schema]) => (
              <option key={property} value={property}>
                {schema.title ? `${schema.title} (${property})` : property}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      )}
    </VStack>
  );
}

interface FilterValueInputProps {
  property: string;
  schema: QueryableSchema;
  kind: QueryableKind;
  value: PropertyFilter['value'];
  onChange: (value: PropertyFilter['value']) => void;
}

function FilterValueInput({
  property,
  schema,
  kind,
  value,
  onChange
}: FilterValueInputProps) {
  const label = `${property} value`;

  if (schema.enum?.length || kind === 'boolean') {
    const options = schema.enum?.length ? schema.enum : [true, false];
    return (
      <NativeSelect.Root size='sm' width='9rem' flexShrink={0}>
        <NativeSelect.Field
          aria-label={label}
          value={String(value)}
          onChange={(e) =>
            onChange(
              options.find((option) => String(option) === e.target.value) ??
                e.target.value
            )
          }
        >
          {options.map((option) => (
            <option key={String(option)} value={String(option)}>
              {String(option)}
            </option>
          ))}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
    );
  }

  if (kind === 'number') {
    return (
      <NumberInput.Root
        size='sm'
        width='9rem'
        flexShrink={0}
        min={schema.minimum}
        max={schema.maximum}
        value={String(value)}
        onValueChange={(details) => {
          if (!isNaN(details.valueAsNumber)) onChange(details.valueAsNumber);
        }}
      >
        <NumberInput.Input aria-label={label} />
      </NumberInput.Root>
    );
  }

  return (
    <Input
      size='sm'
      width='9rem'
      flexShrink={0}
      aria-label={label}
      value={String(value)}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
