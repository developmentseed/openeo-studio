import { useState } from 'react';
import { Flex, Text, Code, Collapsible } from '@chakra-ui/react';
import { CollapseIconButton } from './icon-buttons';

/**
 * Display available variables from the loader script.
 * Helps users understand what they can use in their algorithm code.
 */
export function AvailableVariables() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Flex
      direction='column'
      gap={2}
      borderWidth='2px'
      borderColor='gray.300'
      layerStyle='handDrawn'
      flexShrink={0}
    >
      <Flex
        alignItems='center'
        justifyContent='space-between'
        p={3}
        pb={isOpen ? 2 : 3}
        cursor='pointer'
        onClick={() => setIsOpen(!isOpen)}
        _hover={{ bg: 'gray.50' }}
      >
        <Text fontSize='sm' fontWeight='bold' color='gray.700'>
          Available from loader.py
        </Text>
        <CollapseIconButton isOpen={isOpen} />
      </Flex>

      <Collapsible.Root open={isOpen}>
        <Collapsible.Content>
          <Flex direction='column' gap={2} px={3} pb={3}>
            <Flex alignItems='baseline' gap={2}>
              <Code fontSize='sm' fontFamily='monospace' colorPalette='blue'>
                datacube
              </Code>
              <Text fontSize='xs' color='gray.500'>
                :
              </Text>
              <Code fontSize='xs' colorPalette='gray'>
                DataCube
              </Code>
            </Flex>
            <Text fontSize='xs' color='gray.600' pl={4}>
              Main data object from openeo.rest.datacube
            </Text>

            <Flex alignItems='baseline' gap={2}>
              <Code fontSize='sm' fontFamily='monospace' colorPalette='blue'>
                reduced
              </Code>
              <Text fontSize='xs' color='gray.500'>
                :
              </Text>
              <Code fontSize='xs' colorPalette='gray'>
                DataCube
              </Code>
            </Flex>
            <Text fontSize='xs' color='gray.600' pl={4}>
              Datacube with pixel selection applied (first pixel in time)
            </Text>
          </Flex>
        </Collapsible.Content>
      </Collapsible.Root>
    </Flex>
  );
}
