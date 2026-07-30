import {
  Box,
  Code,
  Flex,
  IconButton,
  Popover,
  RadioGroup,
  Separator,
  Switch,
  Tabs,
  Text,
  VStack
} from '@chakra-ui/react';
import { LuExternalLink, LuLayers, LuX } from 'react-icons/lu';
import type { ServiceInfo } from '$types';

interface BaseLayerOption {
  id: string;
  label: string;
  styleUrl: string;
}

interface MapLayerSelectorProps {
  services: ServiceInfo[];
  onToggleLayer: (serviceId: string) => void;
  onServicePublish?: (service: ServiceInfo) => void;
  baseOptions: BaseLayerOption[];
  baseValue: string;
  onBaseChange: (id: string) => void;
}

export function MapLayerSelector({
  services,
  onToggleLayer,
  onServicePublish,
  baseOptions,
  baseValue,
  onBaseChange
}: MapLayerSelectorProps) {
  return (
    <Box position='absolute' top={4} left={4} zIndex={1000}>
      <Popover.Root
        positioning={{ placement: 'bottom-start' }}
        size='xs'
        defaultOpen
      >
        <Popover.Trigger asChild>
          <IconButton size='sm' aria-label='Select map layers' variant='subtle'>
            <LuLayers />
          </IconButton>
        </Popover.Trigger>
        <Popover.Positioner>
          <Popover.Content minW={64} overflow='hidden'>
            <Popover.Body p={0}>
              <Tabs.Root
                variant='subtle'
                defaultValue='data'
                css={{
                  '&': { '--tabs-height': '2rem' }
                }}
              >
                <Flex align='center' gap={2} p={4}>
                  <Text fontWeight='bold'>Layers</Text>
                  <Tabs.List ml='auto' h={4}>
                    <Tabs.Trigger value='data' py={1}>
                      Data
                    </Tabs.Trigger>
                    <Tabs.Trigger value='base'>Base</Tabs.Trigger>
                  </Tabs.List>
                  <Separator orientation='vertical' h='4' />
                  <Popover.CloseTrigger asChild>
                    <IconButton size='xs' variant='ghost' aria-label='Close'>
                      <LuX />
                    </IconButton>
                  </Popover.CloseTrigger>
                </Flex>

                <Tabs.Content value='data' bg='bg.subtle' p={4}>
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
                    <VStack align='stretch' gap={0}>
                      {services.map((service) => (
                        <Flex
                          key={service.id}
                          align='center'
                          justify='space-between'
                          gap={2}
                        >
                          <Text
                            fontSize='sm'
                            color={service.visible ? 'fg' : 'fg.subtle'}
                            flex={1}
                            truncate
                          >
                            {service.graphResult.name}
                          </Text>
                          {onServicePublish && (
                            <IconButton
                              aria-label='Publish as permanent service'
                              size='xs'
                              variant='ghost'
                              onClick={() => onServicePublish(service)}
                            >
                              <LuExternalLink />
                            </IconButton>
                          )}
                          <Switch.Root
                            size='sm'
                            checked={service.visible}
                            onCheckedChange={() => onToggleLayer(service.id)}
                          >
                            <Switch.HiddenInput />
                            <Switch.Control>
                              <Switch.Thumb />
                            </Switch.Control>
                          </Switch.Root>
                        </Flex>
                      ))}
                    </VStack>
                  )}
                </Tabs.Content>

                <Tabs.Content value='base' bg='bg.subtle' p={4}>
                  <VStack align='stretch' gap={0} asChild>
                    <RadioGroup.Root
                      size='sm'
                      value={baseValue}
                      onValueChange={(e) => onBaseChange(e.value as string)}
                    >
                      {baseOptions.map((option) => (
                        <Flex
                          key={option.id}
                          align='center'
                          justify='space-between'
                          borderRadius='sm'
                          lineHeight='2rem'
                        >
                          <Text fontSize='sm' truncate flex={1}>
                            {option.label}
                          </Text>

                          <RadioGroup.Item value={option.id}>
                            <RadioGroup.ItemHiddenInput />
                            <RadioGroup.ItemIndicator />
                          </RadioGroup.Item>
                        </Flex>
                      ))}
                    </RadioGroup.Root>
                  </VStack>
                </Tabs.Content>
              </Tabs.Root>
            </Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Popover.Root>
    </Box>
  );
}
