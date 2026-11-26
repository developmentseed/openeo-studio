import { useRef, useState } from 'react';
import {
  Box,
  Code,
  Flex,
  Heading,
  IconButton,
  InputGroup,
  NumberInput,
  Popover,
  RadioGroup,
  Separator,
  Stack,
  Switch,
  Text
} from '@chakra-ui/react';
import { LuDroplet, LuLayers, LuX } from 'react-icons/lu';
import type { ServiceInfo } from '$types';
import type { BaseLayer } from '$config/basemaps';

interface MapLayerSelectorProps {
  services: ServiceInfo[];
  onToggleLayer: (serviceId: string) => void;
  onOpacityChange: (serviceId: string, opacity: number) => void;
  baseOptions: BaseLayer[];
  baseValue: string;
  onBaseChange: (id: string) => void;
}

export function MapLayerSelector({
  services,
  onToggleLayer,
  onOpacityChange,
  baseOptions,
  baseValue,
  onBaseChange
}: MapLayerSelectorProps) {
  return (
    <Box position='absolute' top={4} right={4} zIndex={1000}>
      <Popover.Root
        positioning={{ placement: 'left-start' }}
        size='xs'
        defaultOpen
      >
        <Popover.Trigger asChild>
          <IconButton
            size='sm'
            shadow='md'
            aria-label='Select map layers'
            variant='subtle'
          >
            <LuLayers />
          </IconButton>
        </Popover.Trigger>
        <Popover.Positioner>
          <Popover.Content w='xs' overflow='hidden' bg='bg.subtle'>
            <Flex align='center' py={2} px={4}>
              <Popover.Title fontWeight='bold'>Layers</Popover.Title>
              <Popover.CloseTrigger asChild>
                <IconButton
                  size='xs'
                  variant='ghost'
                  aria-label='Close'
                  ml='auto'
                >
                  <LuX />
                </IconButton>
              </Popover.CloseTrigger>
            </Flex>

            <Popover.Body
              p={0}
              bg='bg'
              borderTopRadius='uni'
              borderTop='1px solid'
              borderColor='border'
            >
              <Stack p={4} gap={3}>
                <Heading size='xs'>Data</Heading>
                {services.length === 0 ? (
                  <Text fontSize='sm'>
                    <Text as='span' fontWeight='bold'>
                      No layers defined.
                    </Text>
                    <br />
                    Use <Code>add_graph_to_map(graph, name)</Code> in your
                    script to add one.
                  </Text>
                ) : (
                  services.map((service) => (
                    <Flex key={service.id} align='center' gap={3}>
                      <Switch.Root
                        size='sm'
                        checked={service.visible}
                        onCheckedChange={() => onToggleLayer(service.id)}
                        flex={1}
                        minW={0}
                      >
                        <Switch.HiddenInput />
                        <Switch.Control>
                          <Switch.Thumb />
                        </Switch.Control>
                        <Switch.Label
                          fontSize='sm'
                          fontWeight='normal'
                          color={service.visible ? 'fg' : 'fg.subtle'}
                          truncate
                        >
                          {service.graphResult.name}
                        </Switch.Label>
                      </Switch.Root>
                      <OpacityInput
                        disabled={!service.visible}
                        label={`${service.graphResult.name} opacity`}
                        value={service.opacity ?? 100}
                        onChange={(opacity) =>
                          onOpacityChange(service.id, opacity)
                        }
                      />
                    </Flex>
                  ))
                )}
              </Stack>

              <Separator />

              <Stack p={4} gap={3}>
                <Heading size='xs'>Basemap</Heading>
                <RadioGroup.Root
                  size='sm'
                  value={baseValue}
                  onValueChange={(e) => onBaseChange(e.value as string)}
                >
                  <Stack gap={3}>
                    {baseOptions.map((option) => (
                      <RadioGroup.Item key={option.id} value={option.id}>
                        <RadioGroup.ItemHiddenInput />
                        <RadioGroup.ItemIndicator />
                        <RadioGroup.ItemText fontWeight='normal' truncate>
                          {option.label}
                        </RadioGroup.ItemText>
                      </RadioGroup.Item>
                    ))}
                  </Stack>
                </RadioGroup.Root>
              </Stack>
            </Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Popover.Root>
    </Box>
  );
}

interface OpacityInputProps {
  label: string;
  value: number;
  disabled: boolean;
  onChange: (value: number) => void;
}

// Map repaints wait for a pause, so scrubbing stays smooth.
const OPACITY_DEBOUNCE_MS = 100;

/**
 * Integer percentage, typed or scrubbed by dragging the droplet sideways.
 * Shows each change at once and reports it once the changes pause.
 */
function OpacityInput({ label, value, disabled, onChange }: OpacityInputProps) {
  const [draft, setDraft] = useState(value);
  const [synced, setSynced] = useState(value);
  // Follow outside changes, such as a re-run resetting the layer.
  if (value !== synced) {
    setSynced(value);
    setDraft(value);
  }
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const change = (next: number) => {
    setDraft(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(next), OPACITY_DEBOUNCE_MS);
  };

  return (
    <NumberInput.Root
      disabled={disabled}
      size='xs'
      w='5.5rem'
      flexShrink={0}
      min={0}
      max={100}
      formatOptions={{ maximumFractionDigits: 0 }}
      value={String(draft)}
      onValueChange={({ valueAsNumber }) => {
        if (!isNaN(valueAsNumber)) {
          change(Math.min(100, Math.max(0, Math.round(valueAsNumber))));
        }
      }}
    >
      <InputGroup
        startElement={
          <NumberInput.Scrubber aria-label={`Drag to change ${label}`}>
            <LuDroplet opacity={disabled ? 0.32 : 1} />
          </NumberInput.Scrubber>
        }
        startElementProps={{ pointerEvents: 'auto' }}
        endElement='%'
        endElementProps={{
          color: disabled ? 'fg.subtle' : 'fg'
        }}
      >
        <NumberInput.Input aria-label={label} />
      </InputGroup>
    </NumberInput.Root>
  );
}
