import {
  Box,
  Code,
  Flex,
  IconButton,
  Popover,
  Portal,
  RadioGroup,
  Separator,
  Switch,
  Tabs,
  Text,
  Tooltip,
  VStack
} from '@chakra-ui/react';
import { LuHardDriveUpload, LuLayers, LuX } from 'react-icons/lu';
import type { ServiceInfo } from '$types';

interface BaseLayerOption {
  id: string;
  label: string;
  styleUrl: {
    light: string;
    dark: string;
  };
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
                size='sm'
                css={{
                  '&': { '--tabs-height': '2rem' }
                }}
              >
                <Flex align='center' gap={2} py={2} px={4} bg='bg.subtle'>
                  <Text fontWeight='bold'>Layers</Text>
                  <Tabs.List ml='auto' h={4} gap={2}>
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

                <Tabs.Content
                  value='data'
                  bg='bg'
                  p={4}
                  borderTopRadius='uni'
                  borderTop='1px solid'
                  borderColor='border'
                >
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
                        <Flex key={service.id} align='center' gap={2}>
                          <Switch.Root
                            size='sm'
                            checked={service.visible}
                            onCheckedChange={() => onToggleLayer(service.id)}
                            w='100%'
                          >
                            <Switch.Label
                              fontSize='sm'
                              fontWeight='normal'
                              color={service.visible ? 'fg' : 'fg.subtle'}
                              flex={1}
                              truncate
                            >
                              {service.graphResult.name}
                            </Switch.Label>
                            <Switch.HiddenInput />
                            <Switch.Control>
                              <Switch.Thumb />
                            </Switch.Control>
                          </Switch.Root>
                          <Separator orientation='vertical' h='4' />
                          {onServicePublish && (
                            <Tooltip.Root
                              positioning={{ placement: 'top' }}
                              openDelay={100}
                            >
                              <Tooltip.Trigger asChild>
                                <IconButton
                                  aria-label='Publish as permanent service'
                                  size='xs'
                                  variant='ghost'
                                  onClick={() => onServicePublish(service)}
                                >
                                  <LuHardDriveUpload />
                                </IconButton>
                              </Tooltip.Trigger>
                              <Portal>
                                <Tooltip.Positioner>
                                  <Tooltip.Content>
                                    <Tooltip.Arrow />
                                    Publish as permanent service
                                  </Tooltip.Content>
                                </Tooltip.Positioner>
                              </Portal>
                            </Tooltip.Root>
                          )}
                        </Flex>
                      ))}
                    </VStack>
                  )}
                </Tabs.Content>

                <Tabs.Content
                  value='base'
                  bg='bg'
                  p={4}
                  borderTopRadius='uni'
                  borderTop='1px solid'
                  borderColor='border'
                >
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
                          lineHeight='2rem'
                          asChild
                        >
                          <RadioGroup.Item value={option.id}>
                            <RadioGroup.ItemText
                              fontWeight='normal'
                              lineHeight='1.75rem'
                              fontSize='sm'
                              truncate
                              flex={1}
                            >
                              {option.label}
                            </RadioGroup.ItemText>
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
