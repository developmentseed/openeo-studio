import { Flex, Text, Code, List, Stack, Separator } from '@chakra-ui/react';

import { PUBLIC_GLOBALS } from '../../algorithms/base/environment';
import SmartLink from '$components/common/smart-link';

function VariableDefinition({ name, type }: { name: string; type: string }) {
  return (
    <Flex alignItems='baseline' gap={2}>
      <Code fontSize='xs' variant='solid' colorPalette='neutral'>
        {name}
      </Code>
      <Text fontSize='xs' color='fg.muted'>
        :
      </Text>

      <Code fontSize='xs' variant='outline' colorPalette='neutral'>
        {type}
      </Code>
    </Flex>
  );
}

/**
 * Display available variables from the loader script.
 * Helps users understand what they can use in their algorithm code.
 */
export function AvailableVariables({
  selectedBands
}: {
  selectedBands: string[];
}) {
  return (
    <>
      <Stack px={3} py={2} gap={2}>
        <Text fontSize='sm' fontWeight='bold'>
          Global Variables
        </Text>
        <List.Root unstyled display='flex' flexDirection='column' gap={2}>
          {PUBLIC_GLOBALS.map((variable) => (
            <List.Item
              key={variable.name}
              display='flex'
              flexDirection='column'
              gap={1}
            >
              <VariableDefinition name={variable.name} type={variable.type} />
              <Text fontSize='xs' color='fg.muted'>
                {variable.description}
              </Text>
            </List.Item>
          ))}
        </List.Root>
        <Text fontSize='xs' color='fg.muted'>
          More detail available in the{' '}
          <SmartLink
            fontWeight={700}
            to='/docs/docs#python-environment-code-contract'
          >
            documentation
          </SmartLink>
          .
        </Text>
      </Stack>

      <Separator />

      <Stack px={3} py={2} gap={2}>
        <Text fontSize='sm' fontWeight='bold'>
          Selected Bands
        </Text>
        {selectedBands.length > 0 ? (
          <List.Root unstyled display='flex' flexDirection='column' gap={2}>
            {selectedBands.map((band, index) => (
              <List.Item
                key={band}
                display='flex'
                flexDirection='column'
                gap={1}
              >
                <VariableDefinition name={`[${index}]`} type={band} />
              </List.Item>
            ))}
          </List.Root>
        ) : (
          <Text fontSize='xs' color='fg.muted'>
            No bands selected.
            <br />
            Use the configuration panel to select bands.
          </Text>
        )}
      </Stack>
    </>
  );
}
