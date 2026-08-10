import {
  Box,
  Flex,
  IconButton,
  IconButtonProps,
  Menu,
  Portal,
  RadioGroup,
  Separator,
  Stack,
  Text,
  VStack
} from '@chakra-ui/react';
import { LuFileBox } from 'react-icons/lu';

import { AvailableVariables } from '$components/editor/available-variables';

export type CodeViewType = 'boilerplate' | 'algorithm';

interface CodeInfoMenuProps {
  codeType: CodeViewType;
  onCodeTypeChange: (codeType: CodeViewType) => void;
  selectedBands: string[];
  triggerProps?: IconButtonProps;
}

export function CodeInfoMenu({
  codeType,
  onCodeTypeChange,
  selectedBands,
  triggerProps
}: CodeInfoMenuProps) {
  return (
    <Menu.Root
      positioning={{
        placement: 'bottom-end'
      }}
    >
      <Menu.Trigger asChild>
        <IconButton
          aria-label='More options'
          size='xs'
          variant='outline'
          bg='colorPalette.contrast'
          {...triggerProps}
        >
          <LuFileBox />
        </IconButton>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content
            minW='18rem'
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            p={0}
            gap={1}
            display='flex'
            flexDirection='column'
            alignItems='stretch'
          >
            <Box px={3} py={2} bg='bg'>
              <Text fontSize='xs' fontWeight='bold'>
                Info
              </Text>
            </Box>

            <Stack
              gap={1}
              borderTopRadius='uni'
              borderTop='1px solid'
              borderColor='border'
              bg='bg.subtle'
            >
              <Stack px={3} py={2} gap={1}>
                <Text fontSize='sm' fontWeight='bold'>
                  View
                </Text>
                <VStack align='stretch' gap={0} asChild>
                  <RadioGroup.Root
                    size='sm'
                    value={codeType}
                    onValueChange={(details) => {
                      if (
                        details.value === 'boilerplate' ||
                        details.value === 'algorithm'
                      ) {
                        onCodeTypeChange(details.value);
                      }
                    }}
                  >
                    {(
                      [
                        {
                          value: 'boilerplate',
                          label: 'Boilerplate (read-only)'
                        },
                        { value: 'algorithm', label: 'Algorithm' }
                      ] as const
                    ).map((option) => (
                      <Flex
                        key={option.value}
                        align='center'
                        justify='space-between'
                        borderRadius='sm'
                        lineHeight='1.75rem'
                        fontWeight='normal'
                        asChild
                      >
                        <RadioGroup.Item value={option.value}>
                          <RadioGroup.ItemText truncate flex={1}>
                            {option.label}
                          </RadioGroup.ItemText>
                          <RadioGroup.ItemHiddenInput />
                          <RadioGroup.ItemIndicator />
                        </RadioGroup.Item>
                      </Flex>
                    ))}
                  </RadioGroup.Root>
                </VStack>
              </Stack>

              <Separator />

              <AvailableVariables selectedBands={selectedBands} />
            </Stack>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
